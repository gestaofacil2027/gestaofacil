let usuarioAtual = null;

async function fazerLogin(email, senha) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: senha
    });

    if (error) {
        return { ok: false, mensagem: 'Não foi possível entrar: ' + error.message };
    }

    usuarioAtual = data.user;
    return { ok: true, user: data.user };
}

async function criarConta(email, senha) {
    const { data, error } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password: senha
    });

    if (error) {
        return { ok: false, mensagem: 'Erro ao criar conta: ' + error.message };
    }

    if (!data.session) {
        return {
            ok: true,
            precisaConfirmarEmail: true,
            mensagem: 'Conta criada! Confira seu e-mail para confirmar (ou desative Confirm email em Authentication > Providers > Email no Supabase).'
        };
    }

    usuarioAtual = data.user;
    return { ok: true, user: data.user };
}

async function sairDaConta() {
    await supabaseClient.auth.signOut();
    usuarioAtual = null;
    alternarTelaAutenticacao(null);
}

function alternarTelaAutenticacao(user) {
    const telaAuth = document.getElementById('tela-auth');
    const appShell = document.getElementById('app-shell');
    const infoUsuario = document.getElementById('usuario-logado-email');

    if (user) {
        usuarioAtual = user;
        telaAuth.style.display = 'none';
        appShell.style.display = 'flex';
        if (infoUsuario) {
            infoUsuario.textContent = user.email;
        }
        if (typeof inicializarAppComUsuario === 'function') {
            inicializarAppComUsuario(user);
        }
    } else {
        usuarioAtual = null;
        telaAuth.style.display = 'flex';
        appShell.style.display = 'none';
    }
}

async function verificarSessaoInicial() {
    const { data } = await supabaseClient.auth.getSession();
    alternarTelaAutenticacao(data?.session?.user || null);

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        alternarTelaAutenticacao(session?.user || null);
    });
}