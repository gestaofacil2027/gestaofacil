<<<<<<< HEAD
let estoque = [];
let pedidos = [];
let vasilhames = [];
let fiados = [];
let fornecedores = [];
let catalogoPersonalizado = [];
let movimentacoes = [];
let historicoFechamentos = [];
let salvandoOperacao = false;

const CATALOGO_BASE = [
    { nome: 'Cerveja Lata 350ml (Fardo 12)', categoria: 'Cervejas', local: 'Câmara Fria', unidade: 'fd', custo: 31.50, preco: 42.90, ncm: '2203.00.00', cfop: '5405', impostoPct: 0 },
    { nome: 'Cerveja 600ml Retornável (Cx 24)', categoria: 'Cervejas', local: 'Depósito / Rua A', unidade: 'cx', custo: 148.00, preco: 192.00, ncm: '2203.00.00', cfop: '5405', impostoPct: 0 },
    { nome: 'Refrigerante Cola 2L (Fardo 6)', categoria: 'Refrigerantes & Sucos', local: 'Rua B', unidade: 'fd', custo: 42.00, preco: 57.00, ncm: '2202.10.00', cfop: '5405', impostoPct: 0 },
    { nome: 'Água Mineral Galão 20L', categoria: 'Água & Gás', local: 'Área Água', unidade: 'gl', custo: 8.50, preco: 16.00, ncm: '2201.10.00', cfop: '5102', impostoPct: 0 },
    { nome: 'Botijão de Gás GLP P13', categoria: 'Água & Gás', local: 'Gaiola Gás', unidade: 'un', custo: 78.00, preco: 110.00, ncm: '2711.19.10', cfop: '5656', impostoPct: 0 }
];

const opcoesData = { weekday: 'long', day: 'numeric', month: 'long' };
document.getElementById('data-atual').textContent = new Date().toLocaleDateString('pt-BR', opcoesData);

function gerarIdUnico() {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

function chaveMovimentacoesSessao() {
    return usuarioAtual ? `gestaofacil_mov_${usuarioAtual.id}` : 'gestaofacil_mov_anon';
}

function salvarMovimentacoesSessao() {
    try {
        sessionStorage.setItem(chaveMovimentacoesSessao(), JSON.stringify(movimentacoes));
    } catch (_e) {}
}

function carregarMovimentacoesSessao() {
    try {
        const raw = sessionStorage.getItem(chaveMovimentacoesSessao());
        movimentacoes = raw ? JSON.parse(raw) : [];
    } catch (_e) {
        movimentacoes = [];
    }
    renderizarMovimentacoes();
}

function registrarMovimentacao(tipo, descricao) {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    movimentacoes.unshift({ id: gerarIdUnico(), tipo, descricao, hora });
    movimentacoes = movimentacoes.slice(0, 15);
    salvarMovimentacoesSessao();
    renderizarMovimentacoes();
}

function renderizarMovimentacoes() {
    const lista = document.getElementById('lista-movimentacoes');
    if (!lista) return;
    if (movimentacoes.length === 0) {
        lista.innerHTML = `<li class="mov-vazio">Nenhuma movimentação registrada nesta sessão ainda.</li>`;
        return;
    }
    lista.innerHTML = movimentacoes.map(m => `
        <li>
            <span class="mov-hora">${m.hora}</span>
            <span class="mov-tipo">${m.tipo}</span>
            <span>${m.descricao}</span>
        </li>
    `).join('');
}

function notificar(mensagem, tipo = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensagem;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visivel'));
    setTimeout(() => {
        toast.classList.remove('visivel');
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

function formatarMoeda(valor) {
    return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function irParaAba(indiceMenu) {
    const botoes = document.querySelectorAll('.menu-btn');
    if (botoes[indiceMenu]) botoes[indiceMenu].click();
}

function mostrarTela(nomeTela, botaoClicado) {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('ativa'));
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tela-' + nomeTela).classList.add('ativa');
    if (botaoClicado) botaoClicado.classList.add('active');

    const titulos = {
        'visao-geral': 'Visão Geral do Negócio',
        'estoque': 'Controle de Estoque & Catálogo',
        'entregas': 'Pedidos, Frota & Espelho de Nota',
        'vasilhames': 'Controle de Vasilhames & Cascos',
        'fiado': 'Caderneta Digital (Fiado / Notas)',
        'fornecedores': 'Fornecedores & Distribuidoras',
        'caixa': 'Fechamento de Caixa & Resumo'
    };
    document.getElementById('titulo-pagina').textContent = titulos[nomeTela] || 'GestãoFácil';
}

function calcularDiasParaVencer(dataValidade) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(dataValidade + 'T00:00:00');
    return Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
}

function obterCatalogoCompleto() {
    return [
        ...CATALOGO_BASE.map(item => ({ ...item, origem: 'Padrão' })),
        ...catalogoPersonalizado.map(item => ({ ...item, origem: 'Meu Catálogo' }))
    ];
}

function preencherCatalogoSelect() {
    const select = document.getElementById('catalogo-rapido');
    if (!select) return;
    const lista = obterCatalogoCompleto();
    select.innerHTML = `<option value="">-- Escolha um produto do catálogo ou digite livremente --</option>`;
    lista.forEach((prod, idx) => {
        const tag = prod.origem === 'Meu Catálogo' ? ' [Salvo]' : '';
        select.innerHTML += `<option value="${idx}">${prod.nome}${tag} (${formatarMoeda(prod.preco)})</option>`;
    });
}

function aplicarProdutoCatalogo() {
    const idx = document.getElementById('catalogo-rapido').value;
    if (idx === '') return;
    const prod = obterCatalogoCompleto()[parseInt(idx, 10)];
    if (!prod) return;

    document.getElementById('prod-nome').value = prod.nome;
    document.getElementById('prod-categoria').value = prod.categoria;
    document.getElementById('prod-local').value = prod.local || 'Depósito';
    document.getElementById('prod-unidade').value = prod.unidade || 'cx';
    document.getElementById('prod-custo').value = prod.custo || '';
    document.getElementById('prod-preco').value = prod.preco || '';
    document.getElementById('prod-ncm').value = prod.ncm || '';
    document.getElementById('prod-cfop').value = prod.cfop || '';
    document.getElementById('prod-imposto').value = prod.impostoPct || 0;
    document.getElementById('prod-qtd').focus();
}

async function salvarNoMeuCatalogo() {
    if (!usuarioAtual || salvandoOperacao) return;
    const nome = document.getElementById('prod-nome').value.trim();
    if (!nome) {
        return notificar('Digite o nome do produto antes de salvar no catálogo.', 'alerta');
    }

    salvandoOperacao = true;
    try {
        const item = {
            user_id: usuarioAtual.id,
            nome,
            categoria: document.getElementById('prod-categoria').value,
            local: document.getElementById('prod-local').value.trim() || 'Depósito',
            unidade: document.getElementById('prod-unidade').value,
            custo: parseFloat(document.getElementById('prod-custo').value) || 0,
            preco: parseFloat(document.getElementById('prod-preco').value) || 0,
            ncm: document.getElementById('prod-ncm').value.trim() || '2202.10.00',
            cfop: document.getElementById('prod-cfop').value.trim() || '5102',
            imposto_pct: parseFloat(document.getElementById('prod-imposto').value) || 0
        };

        const { error } = await supabaseClient
            .from('catalogo_custom')
            .upsert(item, { onConflict: 'user_id,nome' });

        if (error) return notificar('Erro ao salvar no catálogo: ' + error.message, 'erro');

        await carregarDadosDoBanco();
        notificar(`"${nome}" salvo no seu catálogo!`, 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
}

function atualizarSelectFornecedores() {
    const select = document.getElementById('prod-fornecedor');
    if (!select) return;
    select.innerHTML = `<option value="">Fornecedor não informado</option>`;
    fornecedores.forEach(f => {
        select.innerHTML += `<option value="${f.nome}">${f.nome} (${f.ramo})</option>`;
    });
}

async function buscarCepPedido() {
    const campoCep = document.getElementById('ped-cep');
    const cepLimpo = campoCep.value.replace(/\D/g, '');
    const statusCep = document.getElementById('status-cep');
    if (cepLimpo.length !== 8) return;

    campoCep.value = `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
    statusCep.textContent = 'Buscando CEP...';
    try {
        const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const dados = await resp.json();
        if (dados.erro) {
            statusCep.textContent = 'CEP não encontrado.';
            return;
        }
        const enderecoAtual = document.getElementById('ped-endereco').value.trim();
        const baseEndereco = `${dados.logradouro}${dados.bairro ? ', ' + dados.bairro : ''}${dados.localidade ? ' - ' + dados.localidade + '/' + dados.uf : ''}`;
        if (!enderecoAtual) {
            document.getElementById('ped-endereco').value = baseEndereco;
        } else if (!enderecoAtual.toLowerCase().includes((dados.localidade || '').toLowerCase())) {
            document.getElementById('ped-endereco').value = `${enderecoAtual} (${baseEndereco})`;
        }
        statusCep.textContent = `✓ ${dados.localidade || ''}/${dados.uf || ''}`;
    } catch (_e) {
        statusCep.textContent = 'Sem internet para CEP.';
    }
}

function baixarCsvExcel(nomeArquivo, linhas) {
    const conteudo = linhas
        .map(colunas => colunas.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');
    const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
}

function exportarEstoqueExcel() {
    if (estoque.length === 0) return notificar('Não há itens no estoque para exportar.', 'alerta');
    const linhas = [['Produto', 'Categoria', 'Fornecedor', 'Local', 'Unidade', 'Quantidade', 'Custo Unit. (R$)', 'Venda Unit. (R$)', 'Imposto Est. (%)', 'Validade', 'NCM', 'CFOP']];
    estoque.forEach(item => {
        const validadeFmt = new Date(item.validade + 'T00:00:00').toLocaleDateString('pt-BR');
        linhas.push([
            item.nome, item.categoria, item.fornecedor || '', item.local || 'Depósito', item.unidade || 'un',
            item.quantidade, Number(item.custo || 0).toFixed(2).replace('.', ','),
            Number(item.preco || 0).toFixed(2).replace('.', ','),
            Number(item.impostoPct || 0).toString().replace('.', ','), validadeFmt, item.ncm || '', item.cfop || ''
        ]);
    });
    baixarCsvExcel(`estoque-gestaofacil-${new Date().toISOString().slice(0, 10)}.csv`, linhas);
    notificar('Planilha de estoque exportada (.CSV).', 'sucesso');
}

function exportarPedidosExcel() {
    if (pedidos.length === 0) return notificar('Não há pedidos lançados para exportar.', 'alerta');
    const linhas = [['Hora', 'Cliente', 'CPF/CNPJ', 'CEP', 'Endereco', 'NF', 'Produto', 'Unidade', 'Quantidade', 'Valor Total (R$)', 'Frota', 'Pagamento', 'Status', 'Oculto da Fila']];
    pedidos.forEach(ped => {
        linhas.push([
            ped.hora || '', ped.cliente, ped.docCliente || '', ped.cep || '', ped.endereco,
            ped.numeroNf || '', ped.produtoNome, ped.unidade || 'un', ped.quantidade,
            Number(ped.valorTotal || 0).toFixed(2).replace('.', ','), ped.frota, ped.pagamento, ped.status,
            ped.ocultoFila ? 'Sim' : 'Não'
        ]);
    });
    baixarCsvExcel(`pedidos-gestaofacil-${new Date().toISOString().slice(0, 10)}.csv`, linhas);
    notificar('Planilha de pedidos exportada (.CSV).', 'sucesso');
}

function exportarFechamentoExcel() {
    const t = obterTotaisFinanceiros();
    const entreguesQtd = pedidos.filter(p => p.status === 'Entregue').length;
    const linhas = [
        ['Resumo do Fechamento de Caixa', 'Valor / Qtd'],
        ['Data / Hora', new Date().toLocaleString('pt-BR')],
        ['Ja Pago (PIX + Quitados)', Number(t.jaPago).toFixed(2).replace('.', ',')],
        ['Cobrar na Maquininha', Number(t.cobrarMaquininha).toFixed(2).replace('.', ',')],
        ['Cobrar em Dinheiro', Number(t.cobrarDinheiro).toFixed(2).replace('.', ',')],
        ['Fiado em Aberto', Number(t.fiadoEmAberto).toFixed(2).replace('.', ',')],
        ['Impostos Estimados', Number(t.impostoTotalEstimado).toFixed(2).replace('.', ',')],
        ['Lucro Liquido Estimado', Number(t.lucroLiquidoTotal).toFixed(2).replace('.', ',')],
        ['Pedidos Entregues', String(entreguesQtd)],
        ['Total de Pedidos Contabilizados', String(pedidos.length)],
        [],
        ['Detalhamento de Pedidos (Inclui Entregues Limpos da Fila)', 'Cliente', 'Produto', 'Qtd', 'Valor Total (R$)', 'Pagamento', 'Status', 'Na Fila']
    ];

    pedidos.forEach(ped => {
        linhas.push([
            ped.hora || '', ped.cliente, ped.produtoNome, ped.quantidade,
            Number(ped.valorTotal || 0).toFixed(2).replace('.', ','), ped.pagamento, ped.status,
            ped.ocultoFila ? 'Oculto' : 'Visível'
        ]);
    });

    baixarCsvExcel(`fechamento-caixa-${new Date().toISOString().slice(0, 10)}.csv`, linhas);
    notificar('Planilha de fechamento exportada (.CSV).', 'sucesso');
}

function renderizarTudo() {
    atualizarSelectFornecedores();
    preencherCatalogoSelect();
    renderizarEstoque();
    atualizarSelectProdutosPedido();
    renderizarPedidos();
    renderizarVasilhames();
    renderizarFiados();
    renderizarFornecedores();
    renderizarFechamentoCaixa();
    renderizarHistoricoFechamentos();
    atualizarResumoGeral();
    renderizarMovimentacoes();
}

async function carregarDadosDoBanco() {
    if (!usuarioAtual) return;

    const [resEst, resPed, resVas, resFia, resForn, resCat, resFech] = await Promise.all([
        supabaseClient.from('estoque').select('*').order('validade', { ascending: true }),
        supabaseClient.from('pedidos').select('*').order('id', { ascending: false }),
        supabaseClient.from('vasilhames').select('*').order('id', { ascending: false }),
        supabaseClient.from('fiados').select('*').order('id', { ascending: false }),
        supabaseClient.from('fornecedores').select('*').order('id', { ascending: false }),
        supabaseClient.from('catalogo_custom').select('*').order('nome', { ascending: true }),
        supabaseClient.from('fechamentos_caixa').select('*').order('id', { ascending: false })
    ]);

    estoque = (resEst.data || []).map(r => ({
        id: r.id, nome: r.nome, categoria: r.categoria, fornecedor: r.fornecedor || '',
        local: r.local || 'Depósito', unidade: r.unidade || 'cx', ncm: r.ncm || '',
        cfop: r.cfop || '', impostoPct: Number(r.imposto_pct) || 0,
        quantidade: Number(r.quantidade) || 0, custo: Number(r.custo) || 0,
        preco: Number(r.preco) || 0, validade: r.validade
    }));

    pedidos = (resPed.data || []).map(r => {
        const statusAtual = r.status === 'Entregue / Arquivado' ? 'Entregue' : r.status;
        const ocultoFila = r.status === 'Entregue / Arquivado' || Boolean(r.oculto_fila);
        return {
            id: r.id, cliente: r.cliente, docCliente: r.doc_cliente || 'Não informado',
            cep: r.cep || 'Não informado', endereco: r.endereco, numeroNf: r.numero_nf || 'Pendente',
            produtoNome: r.produto_nome, unidade: r.unidade || 'un', ncm: r.ncm || '',
            cfop: r.cfop || '', loteId: r.lote_id, quantidade: Number(r.quantidade) || 1,
            valorTotal: Number(r.valor_total) || 0, impostoEstimado: Number(r.imposto_estimado) || 0,
            lucroLiquidoEstimado: Number(r.lucro_liquido_estimado) || 0,
            frota: r.frota, pagamento: r.pagamento, status: statusAtual,
            ocultoFila, hora: r.hora || ''
        };
    });

    vasilhames = (resVas.data || []).map(r => ({
        id: r.id, cliente: r.cliente, tipo: r.tipo,
        qtdPendente: Number(r.qtd_pendente) || 0, data: r.data || ''
    }));

    fiados = (resFia.data || []).map(r => ({
        id: r.id, pedidoId: r.pedido_id, cliente: r.cliente, descricao: r.descricao,
        valor: Number(r.valor) || 0, data: r.data || '', pago: Boolean(r.pago)
    }));

    fornecedores = (resForn.data || []).map(r => ({
        id: r.id, nome: r.nome, ramo: r.ramo, contato: r.contato || 'Não informado', obs: r.obs || '—'
    }));

    catalogoPersonalizado = (resCat.data || []).map(r => ({
        nome: r.nome, categoria: r.categoria, local: r.local || 'Depósito', unidade: r.unidade || 'cx',
        custo: Number(r.custo) || 0, preco: Number(r.preco) || 0, ncm: r.ncm || '',
        cfop: r.cfop || '', impostoPct: Number(r.imposto_pct) || 0
    }));

    if (!resFech.error && Array.isArray(resFech.data)) {
        historicoFechamentos = resFech.data.map(f => ({
            id: f.id,
            dataHora: f.data_hora,
            jaPago: Number(f.ja_pago) || 0,
            maquininha: Number(f.maquininha) || 0,
            dinheiro: Number(f.dinheiro) || 0,
            fiado: Number(f.fiado) || 0,
            impostoEstimado: Number(f.imposto_estimado) || 0,
            lucro: Number(f.lucro_estimado) || 0,
            entreguesQtd: Number(f.entregues_qtd) || 0,
            totalPedidos: Number(f.total_pedidos) || 0
        }));
    }

    renderizarTudo();
}

async function inicializarAppComUsuario() {
    carregarMovimentacoesSessao();
    await carregarDadosDoBanco();
}

// ESTOQUE
document.getElementById('form-estoque').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!usuarioAtual || salvandoOperacao) return;

    salvandoOperacao = true;
    try {
        const nome = document.getElementById('prod-nome').value.trim();
        const qtd = parseInt(document.getElementById('prod-qtd').value, 10);
        const unidade = document.getElementById('prod-unidade').value;
        const categoria = document.getElementById('prod-categoria').value;
        const fornecedor = document.getElementById('prod-fornecedor').value || null;
        const local = document.getElementById('prod-local').value.trim() || 'Depósito';
        const ncm = document.getElementById('prod-ncm').value.trim() || '2202.10.00';
        const cfop = document.getElementById('prod-cfop').value.trim() || '5102';
        const impostoPct = parseFloat(document.getElementById('prod-imposto').value) || 0;
        const custo = parseFloat(document.getElementById('prod-custo').value) || 0;
        const preco = parseFloat(document.getElementById('prod-preco').value) || 0;
        const validade = document.getElementById('prod-validade').value;

        // Reaproveita lote zerado se bater produto + local + validade (evita linha morta zerada)
        const loteZeradoCompativel = estoque.find(p =>
            p.quantidade === 0 &&
            p.nome.toLowerCase() === nome.toLowerCase() &&
            (p.local || 'Depósito').toLowerCase() === local.toLowerCase() &&
            p.validade === validade
        );

        if (loteZeradoCompativel) {
            const { error: errUpd } = await supabaseClient.from('estoque').update({
                categoria,
                fornecedor,
                unidade,
                ncm,
                cfop,
                imposto_pct: impostoPct,
                quantidade: qtd,
                custo,
                preco
            }).eq('id', loteZeradoCompativel.id);

            if (errUpd) return notificar('Erro ao atualizar lote zerado: ' + errUpd.message, 'erro');
            registrarMovimentacao('Reposição', `Lote zerado reativado com +${qtd} ${unidade} de "${nome}"`);
        } else {
            const item = {
                id: gerarIdUnico(),
                user_id: usuarioAtual.id,
                nome,
                categoria,
                fornecedor,
                local,
                unidade,
                ncm,
                cfop,
                imposto_pct: impostoPct,
                quantidade: qtd,
                custo,
                preco,
                validade
            };

            const { error } = await supabaseClient.from('estoque').insert(item);
            if (error) return notificar('Erro ao salvar estoque: ' + error.message, 'erro');
            registrarMovimentacao('Entrada', `+${qtd} ${unidade} de "${nome}"`);
        }

        this.reset();
        document.getElementById('catalogo-rapido').value = '';
        await carregarDadosDoBanco();
        notificar('Mercadoria registrada no estoque!', 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
});

async function editarLoteRapido(id) {
    const item = estoque.find(p => p.id === id);
    if (!item || salvandoOperacao) return;

    const novoPrecoStr = prompt(`Preço de venda unitário (R$) para "${item.nome}":`, String(item.preco || 0));
    if (novoPrecoStr === null) return;
    const novoCustoStr = prompt(`Custo unitário (R$) para "${item.nome}":`, String(item.custo || 0));
    if (novoCustoStr === null) return;
    const novoLocal = prompt(`Local / Setor de "${item.nome}":`, item.local || 'Depósito');
    if (novoLocal === null) return;

    const novoPreco = parseFloat(String(novoPrecoStr).replace(',', '.'));
    const novoCusto = parseFloat(String(novoCustoStr).replace(',', '.'));

    salvandoOperacao = true;
    try {
        await supabaseClient.from('estoque').update({
            preco: isNaN(novoPreco) ? item.preco : Math.max(0, novoPreco),
            custo: isNaN(novoCusto) ? item.custo : Math.max(0, novoCusto),
            local: novoLocal.trim() || 'Depósito'
        }).eq('id', id);

        await carregarDadosDoBanco();
        notificar(`Valores e local de "${item.nome}" atualizados!`, 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
}

async function baixarUnidade(id) {
    const item = estoque.find(p => p.id === id);
    if (!item || item.quantidade <= 0 || salvandoOperacao) return;
    const novaQtd = item.quantidade - 1;
    salvandoOperacao = true;
    try {
        if (novaQtd === 0 && confirm(`O estoque de "${item.nome}" zerou. Deseja excluir este lote da lista?`)) {
            await supabaseClient.from('estoque').delete().eq('id', id);
        } else {
            await supabaseClient.from('estoque').update({ quantidade: Math.max(0, novaQtd) }).eq('id', id);
        }
        registrarMovimentacao('Saída', `-1 ${item.unidade} de "${item.nome}"`);
        await carregarDadosDoBanco();
        notificar(`Estoque de "${item.nome}" atualizado.`, 'info');
    } finally {
        salvandoOperacao = false;
    }
}

async function reporUnidades(id) {
    const item = estoque.find(p => p.id === id);
    if (!item || salvandoOperacao) return;
    const sugestao = item.quantidade === 0 ? '20' : '10';
    const qtdAdicionar = parseInt(prompt(`Quantas unidades (${item.unidade}) entraram para "${item.nome}"?`, sugestao), 10);
    if (isNaN(qtdAdicionar) || qtdAdicionar <= 0) return;

    salvandoOperacao = true;
    try {
        await supabaseClient.from('estoque').update({ quantidade: item.quantidade + qtdAdicionar }).eq('id', id);
        registrarMovimentacao('Reposição', `+${qtdAdicionar} ${item.unidade} em "${item.nome}"`);
        await carregarDadosDoBanco();
        notificar(`+${qtdAdicionar} ${item.unidade} adicionados a "${item.nome}".`, 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
}

async function removerLote(id) {
    if (salvandoOperacao) return;
    const item = estoque.find(p => p.id === id);
    if (!confirm(`Excluir o lote "${item ? item.nome : 'selecionado'}" do estoque?`)) return;
    salvandoOperacao = true;
    try {
        await supabaseClient.from('estoque').delete().eq('id', id);
        if (item) registrarMovimentacao('Remoção', `Lote "${item.nome}" excluído`);
        await carregarDadosDoBanco();
        notificar('Lote removido do estoque.', 'info');
    } finally {
        salvandoOperacao = false;
    }
}

function limparFiltrosEstoque() {
    const busca = document.getElementById('busca-estoque');
    const filtro = document.getElementById('filtro-estoque');
    if (busca) busca.value = '';
    if (filtro) filtro.value = 'TODOS';
    renderizarEstoque();
}

function renderizarResumoRapidoEstoque() {
    const box = document.getElementById('resumo-rapido-estoque');
    if (!box) return;
    const ativos = estoque.filter(i => i.quantidade > 0).length;
    const zerados = estoque.filter(i => i.quantidade === 0).length;
    const criticos = estoque.filter(i => calcularDiasParaVencer(i.validade) <= 15).length;
    box.innerHTML = `
        <span class="chip-neutro"><strong>Ativos:</strong> ${ativos} lote(s)</span>
        <span class="chip-alerta"><strong>Validade ≤15d / Vencidos:</strong> ${criticos}</span>
        <span class="chip-neutro"><strong>Zerados (ocultos por padrão):</strong> ${zerados}</span>
    `;
}

function renderizarEstoque() {
    renderizarResumoRapidoEstoque();
    const tbody = document.getElementById('tabela-estoque-corpo');
    const termoBusca = document.getElementById('busca-estoque').value.toLowerCase();
    const filtroTipo = document.getElementById('filtro-estoque').value;
    tbody.innerHTML = '';

    const filtrados = estoque.filter(item => {
        const bateTexto =
            item.nome.toLowerCase().includes(termoBusca) ||
            item.categoria.toLowerCase().includes(termoBusca) ||
            (item.fornecedor || '').toLowerCase().includes(termoBusca) ||
            (item.local || '').toLowerCase().includes(termoBusca) ||
            (item.ncm || '').toLowerCase().includes(termoBusca);
        if (!bateTexto) return false;

        const dias = calcularDiasParaVencer(item.validade);
        if (filtroTipo === 'zerados') return item.quantidade === 0;
        if (filtroTipo === 'vencendo') return item.quantidade > 0 && dias <= 15;
        if (filtroTipo === 'baixo') return item.quantidade > 0 && item.quantidade <= 5;

        // Padrão ("TODOS"): oculta lotes zerados para manter a lista limpa
        return item.quantidade > 0;
    });

    if (filtrados.length === 0) {
        const msgVazio = filtroTipo === 'zerados'
            ? 'Nenhum lote zerado registrado.'
            : 'Nenhum produto disponível encontrado.';
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding: 24px;">${msgVazio}</td></tr>`;
        return;
    }

    filtrados.forEach(item => {
        const dias = calcularDiasParaVencer(item.validade);
        const dataFormatada = new Date(item.validade + 'T00:00:00').toLocaleDateString('pt-BR');
        let statusBadge = `<span class="badge ok">Normal (${dias}d)</span>`;
        let classeLinha = '';
        if (item.quantidade === 0) {
            statusBadge = `<span class="badge alerta">Zerado (0)</span>`;
        } else if (dias < 0) {
            statusBadge = `<span class="badge vencido">Vencido há ${Math.abs(dias)}d</span>`;
            classeLinha = 'linha-vencida';
        } else if (dias <= 15) {
            statusBadge = `<span class="badge alerta">Vence em ${dias}d!</span>`;
            classeLinha = 'linha-alerta';
        }
        const alertaEstoqueBaixo = item.quantidade > 0 && item.quantidade <= 5 ? `<span class="tag-baixo">⚠️ Baixo</span>` : '';
        const valoresInfo = `
            ${item.preco > 0 ? `<strong>Venda: ${formatarMoeda(item.preco)}</strong>` : '<span style="color:#94a3b8">Sem venda</span>'}
            ${item.custo > 0 ? `<br><small style="color:#64748b">Custo: ${formatarMoeda(item.custo)}</small>` : ''}
            ${item.impostoPct > 0 ? `<br><small style="color:#0369a1">Imp: ${item.impostoPct}%</small>` : ''}
        `;
        const fornecedorDetalhe = item.fornecedor ? ` • 🏭 ${item.fornecedor}` : '';
        const tr = document.createElement('tr');
        tr.className = classeLinha;
        tr.innerHTML = `
            <td><strong>${item.nome}</strong><br><small style="color:#64748b">${item.categoria} • 📍 ${item.local || 'Depósito'}${fornecedorDetalhe}</small><br><small style="color:#475569">NCM: ${item.ncm || '—'} • CFOP: ${item.cfop || '—'}</small></td>
            <td><strong>${item.quantidade}</strong> ${item.unidade || 'un'} ${alertaEstoqueBaixo}</td>
            <td>${valoresInfo}</td>
            <td>${dataFormatada}</td>
            <td>${statusBadge}</td>
            <td class="acoes-tabela">
                <button class="btn-mini acao-ok" onclick="reporUnidades(${item.id})">+ Repor</button>
                ${item.quantidade > 0 ? `<button class="btn-mini" onclick="baixarUnidade(${item.id})">-1</button>` : ''}
                <button class="btn-mini" title="Editar valores e local" onclick="editarLoteRapido(${item.id})">✏️</button>
                <button class="btn-mini perigo" onclick="removerLote(${item.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// PEDIDOS
function atualizarSelectProdutosPedido() {
    const select = document.getElementById('ped-produto');
    const disponiveis = estoque.filter(item => item.quantidade > 0);
    if (disponiveis.length === 0) {
        select.innerHTML = `<option value="">Sem produtos disponíveis no estoque</option>`;
        return;
    }
    select.innerHTML = `<option value="">Selecione um lote do estoque...</option>`;
    disponiveis.forEach(item => {
        const dataFormatada = new Date(item.validade + 'T00:00:00').toLocaleDateString('pt-BR');
        const precoTexto = item.preco > 0 ? ` • ${formatarMoeda(item.preco)}` : '';
        select.innerHTML += `<option value="${item.id}">${item.nome} (Disp: ${item.quantidade} ${item.unidade || 'un'} | Val: ${dataFormatada}${precoTexto})</option>`;
    });
}

document.getElementById('form-pedido').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!usuarioAtual || salvandoOperacao) return;

    const cliente = document.getElementById('ped-cliente').value.trim();
    const docCliente = document.getElementById('ped-doc').value.trim() || 'Não informado';
    const cep = document.getElementById('ped-cep').value.trim() || 'Não informado';
    const endereco = document.getElementById('ped-endereco').value.trim();
    const numeroNf = document.getElementById('ped-nf').value.trim() || 'Pendente';
    const loteId = parseInt(document.getElementById('ped-produto').value, 10);
    const qtd = parseInt(document.getElementById('ped-qtd').value, 10);
    const frota = document.getElementById('ped-frota').value;
    const pagamento = document.getElementById('ped-pagamento').value;

    const itemEstoque = estoque.find(p => p.id === loteId);
    if (!itemEstoque) return notificar('Selecione um produto válido do estoque.', 'alerta');
    if (qtd > itemEstoque.quantidade) return notificar(`Estoque insuficiente! Disponível: ${itemEstoque.quantidade}.`, 'alerta');

    salvandoOperacao = true;
    try {
        const valorTotal = qtd * (Number(itemEstoque.preco) || 0);
        const custoTotal = qtd * (Number(itemEstoque.custo) || 0);
        const impostoEstimado = valorTotal * ((Number(itemEstoque.impostoPct) || 0) / 100);
        const lucroLiquidoEstimado = itemEstoque.preco > 0 ? (valorTotal - custoTotal - impostoEstimado) : 0;
        const idPedido = gerarIdUnico();
        const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const { error: errEst } = await supabaseClient
            .from('estoque')
            .update({ quantidade: itemEstoque.quantidade - qtd })
            .eq('id', itemEstoque.id);
        if (errEst) return notificar('Erro ao atualizar estoque: ' + errEst.message, 'erro');

        const { error: errPed } = await supabaseClient.from('pedidos').insert({
            id: idPedido,
            user_id: usuarioAtual.id,
            cliente,
            doc_cliente: docCliente,
            cep,
            endereco,
            numero_nf: numeroNf,
            produto_nome: itemEstoque.nome,
            unidade: itemEstoque.unidade || 'un',
            ncm: itemEstoque.ncm || '2202.10.00',
            cfop: itemEstoque.cfop || '5102',
            lote_id: itemEstoque.id,
            quantidade: qtd,
            valor_total: valorTotal,
            imposto_estimado: impostoEstimado,
            lucro_liquido_estimado: lucroLiquidoEstimado,
            frota,
            pagamento,
            status: 'Separando',
            hora
        });
        if (errPed) {
            await supabaseClient.from('estoque').update({ quantidade: itemEstoque.quantidade }).eq('id', itemEstoque.id);
            return notificar('Erro ao lançar pedido: ' + errPed.message, 'erro');
        }

        if (pagamento === 'Fiado / Nota') {
            await supabaseClient.from('fiados').insert({
                id: gerarIdUnico(),
                user_id: usuarioAtual.id,
                pedido_id: idPedido,
                cliente,
                descricao: `${qtd} ${itemEstoque.unidade || 'un'} - ${itemEstoque.nome}`,
                valor: valorTotal,
                data: new Date().toLocaleDateString('pt-BR'),
                pago: false
            });
        }

        registrarMovimentacao('Pedido', `${qtd} ${itemEstoque.unidade || 'un'} ${itemEstoque.nome} para ${cliente}`);
        const cascosPendentesCliente = vasilhames.filter(v => v.cliente.toLowerCase() === cliente.toLowerCase() && v.qtdPendente > 0);
        this.reset();
        document.getElementById('status-cep').textContent = '';
        await carregarDadosDoBanco();

        if (cascosPendentesCliente.length > 0) {
            const totalCascos = cascosPendentesCliente.reduce((acc, v) => acc + v.qtdPendente, 0);
            notificar(`Pedido lançado! Atenção: ${cliente} tem ${totalCascos} casco(s) pendente(s).`, 'alerta');
        } else {
            notificar('Pedido lançado com sucesso!', 'sucesso');
        }
    } finally {
        salvandoOperacao = false;
    }
});

async function avancarStatusPedido(id) {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido || salvandoOperacao) return;
    const proximo = pedido.status === 'Separando' ? 'Em Rota' : (pedido.status === 'Em Rota' ? 'Entregue' : 'Entregue');
    salvandoOperacao = true;
    try {
        await supabaseClient.from('pedidos').update({ status: proximo }).eq('id', id);
        registrarMovimentacao('Entrega', `${pedido.cliente}: ${proximo}`);
        await carregarDadosDoBanco();
        notificar(`Pedido de "${pedido.cliente}" marcado como ${proximo}.`, 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
}

async function voltarStatusPedido(id) {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido || salvandoOperacao) return;
    const anterior = pedido.status === 'Entregue' ? 'Em Rota' : (pedido.status === 'Em Rota' ? 'Separando' : 'Separando');
    salvandoOperacao = true;
    try {
        await supabaseClient.from('pedidos').update({ status: anterior }).eq('id', id);
        await carregarDadosDoBanco();
        notificar(`Status de "${pedido.cliente}" voltou para ${anterior}.`, 'info');
    } finally {
        salvandoOperacao = false;
    }
}

async function alterarPagamentoPedido(id, novoPagamento) {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido || salvandoOperacao || pedido.pagamento === novoPagamento) return;

    salvandoOperacao = true;
    try {
        await supabaseClient.from('pedidos').update({ pagamento: novoPagamento }).eq('id', id);

        if (novoPagamento === 'Fiado / Nota') {
            const fiadoExistente = fiados.find(f => f.pedidoId === id);
            if (!fiadoExistente) {
                await supabaseClient.from('fiados').insert({
                    id: gerarIdUnico(),
                    user_id: usuarioAtual.id,
                    pedido_id: id,
                    cliente: pedido.cliente,
                    descricao: `${pedido.quantidade} ${pedido.unidade || 'un'} - ${pedido.produtoNome}`,
                    valor: pedido.valorTotal,
                    data: new Date().toLocaleDateString('pt-BR'),
                    pago: false
                });
            }
        } else {
            await supabaseClient.from('fiados').delete().eq('pedido_id', id).eq('pago', false);
        }

        registrarMovimentacao('Pagamento', `${pedido.cliente}: ${novoPagamento}`);
        await carregarDadosDoBanco();
        notificar(`Pagamento alterado para "${novoPagamento}".`, 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
}

async function cancelarPedido(id) {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido || salvandoOperacao) return;
    if (!confirm(`Cancelar pedido de "${pedido.cliente}" (${formatarMoeda(pedido.valorTotal)}) e devolver ${pedido.quantidade} ao estoque?`)) return;

    salvandoOperacao = true;
    try {
        const itemEstoque = estoque.find(p => p.id === pedido.loteId);
        if (itemEstoque) {
            await supabaseClient.from('estoque').update({ quantidade: itemEstoque.quantidade + pedido.quantidade }).eq('id', itemEstoque.id);
        }
        await supabaseClient.from('fiados').delete().eq('pedido_id', id);
        await supabaseClient.from('pedidos').delete().eq('id', id);
        registrarMovimentacao('Cancelamento', `+${pedido.quantidade} ${pedido.unidade} devolvidos (${pedido.cliente})`);
        await carregarDadosDoBanco();
        notificar('Pedido cancelado e estoque estornado.', 'info');
    } finally {
        salvandoOperacao = false;
    }
}

async function limparEntregues() {
    const concluidosVisiveis = pedidos.filter(p => p.status === 'Entregue' && !p.ocultoFila);
    if (concluidosVisiveis.length === 0) return notificar('Não há pedidos entregues visíveis na fila para limpar.', 'alerta');
    if (!confirm(`Ocultar ${concluidosVisiveis.length} pedido(s) Entregue da fila da tela? Os valores permanecem no Fechamento do Dia.`)) return;

    salvandoOperacao = true;
    try {
        const { error } = await supabaseClient
            .from('pedidos')
            .update({ status: 'Entregue / Arquivado' })
            .eq('status', 'Entregue');

        if (error) {
            return notificar('Não foi possível limpar da fila: ' + error.message, 'erro');
        }

        registrarMovimentacao('Fila Limpa', `${concluidosVisiveis.length} pedido(s) entregue(s) ocultado(s) da fila; caixa preservado`);
        await carregarDadosDoBanco();
        notificar(`${concluidosVisiveis.length} pedido(s) removido(s) da fila sem afetar o caixa.`, 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
}

function obterPedidosFiltrados() {
    const filtroFrota = document.getElementById('filtro-frota').value;
    const filtroStatus = document.getElementById('filtro-status-pedido')?.value || 'TODOS';
    return pedidos.filter(p => {
        if (p.ocultoFila && filtroStatus !== 'Entregue') return false;
        const bateFrota = filtroFrota === 'TODAS' || p.frota === filtroFrota;
        const bateStatus = filtroStatus === 'TODOS' || p.status === filtroStatus;
        return bateFrota && bateStatus;
    });
}

function copiarRomaneioWhatsApp() {
    const base = obterPedidosFiltrados();
    const ativos = base.filter(p => p.status !== 'Entregue');
    const listaParaCopiar = ativos.length > 0 ? ativos : base;
    if (listaParaCopiar.length === 0) return notificar('Não há pedidos para gerar o romaneio.', 'alerta');

    let texto = `🚚 *ROMANEIO DE ENTREGAS* (${new Date().toLocaleDateString('pt-BR')})\n\n`;
    listaParaCopiar.forEach((ped, idx) => {
        const valorFmt = ped.valorTotal > 0 ? ` — ${formatarMoeda(ped.valorTotal)}` : '';
        texto += `*${idx + 1}. ${ped.cliente}* [${ped.status}]\n📍 ${ped.endereco}\n📦 ${ped.quantidade} ${ped.unidade || 'un'} - ${ped.produtoNome}${valorFmt}\n🚛 ${ped.frota} | 💳 ${ped.pagamento}\n\n`;
    });

    navigator.clipboard.writeText(texto.trim())
        .then(() => notificar('Romaneio copiado para a área de transferência!', 'sucesso'))
        .catch(() => prompt('Copie o romaneio:', texto.trim()));
}

function imprimirComprovantePedido(id) {
    const ped = pedidos.find(p => p.id === id);
    if (!ped) return;
    const janela = window.open('', '_blank', 'width=460,height=640');
    janela.document.write(`
        <html><body style="font-family:Arial,sans-serif;padding:24px;">
            <h2>📦 GestãoFácil — Comprovante</h2>
            <p><strong>Cliente:</strong> ${ped.cliente} • <strong>Doc:</strong> ${ped.docCliente}</p>
            <p><strong>NF:</strong> ${ped.numeroNf} • <strong>Hora:</strong> ${ped.hora}</p>
            <p><strong>Endereço:</strong> ${ped.endereco} (${ped.cep})</p>
            <p><strong>Item:</strong> ${ped.quantidade} ${ped.unidade} — ${ped.produtoNome}</p>
            <p><strong>Frota:</strong> ${ped.frota} • <strong>Pagamento:</strong> ${ped.pagamento}</p>
            <h3>Total: ${formatarMoeda(ped.valorTotal)}</h3>
            <button onclick="window.print()">🖨️ Imprimir</button>
        </body></html>
    `);
    janela.document.close();
}

function renderizarPedidos() {
    const tbody = document.getElementById('tabela-pedidos-corpo');
    const lista = obterPedidosFiltrados();
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding: 24px;">Nenhum pedido encontrado na fila.</td></tr>`;
        return;
    }
    lista.forEach(ped => {
        let badgeStatus = ped.status === 'Separando'
            ? `<span class="badge alerta">📦 Separando</span>`
            : (ped.status === 'Em Rota' ? `<span class="badge rota">🛵 Em Rota</span>` : `<span class="badge ok">✔️ Entregue</span>`);

        let botaoAvancar = ped.status === 'Separando'
            ? `<button class="btn-mini acao-rota" onclick="avancarStatusPedido(${ped.id})">🚚 Despachar</button>`
            : (ped.status === 'Em Rota' ? `<button class="btn-mini acao-ok" onclick="avancarStatusPedido(${ped.id})">✅ Entregar</button>` : '');

        let botaoVoltar = ped.status !== 'Separando'
            ? `<button class="btn-mini" title="Voltar status" onclick="voltarStatusPedido(${ped.id})">↩</button>`
            : '';

        const opcoesPag = ['Cobrar Maquininha', 'Cobrar Dinheiro', 'Já Pago (PIX)', 'Fiado / Nota']
            .map(op => `<option value="${op}" ${ped.pagamento === op ? 'selected' : ''}>${op}</option>`)
            .join('');

        const tr = document.createElement('tr');
        if (ped.status === 'Entregue') tr.style.opacity = '0.72';
        tr.innerHTML = `
            <td><strong>${ped.cliente}</strong><br><small style="color:#64748b">📍 ${ped.endereco} • ${ped.hora} • NF: ${ped.numeroNf}</small></td>
            <td><strong>${ped.quantidade} ${ped.unidade}</strong> ${ped.produtoNome}<br><small style="font-weight:600;">${formatarMoeda(ped.valorTotal)}</small></td>
            <td>${ped.frota}</td>
            <td>
                <select class="select-tabela" onchange="alterarPagamentoPedido(${ped.id}, this.value)">
                    ${opcoesPag}
                </select>
            </td>
            <td>${badgeStatus}</td>
            <td class="acoes-tabela">
                ${botaoAvancar}
                ${botaoVoltar}
                <button class="btn-mini" onclick="imprimirComprovantePedido(${ped.id})">🧾</button>
                <button class="btn-mini perigo" onclick="cancelarPedido(${ped.id})">✖</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// VASILHAMES
document.getElementById('form-vasilhame').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!usuarioAtual || salvandoOperacao) return;

    salvandoOperacao = true;
    try {
        await supabaseClient.from('vasilhames').insert({
            id: gerarIdUnico(),
            user_id: usuarioAtual.id,
            cliente: document.getElementById('vas-cliente').value.trim(),
            tipo: document.getElementById('vas-tipo').value,
            qtd_pendente: parseInt(document.getElementById('vas-qtd').value, 10),
            data: new Date().toLocaleDateString('pt-BR')
        });
        this.reset();
        await carregarDadosDoBanco();
        notificar('Saída de vasilhame registrada!', 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
});

async function devolverCasco(id, qtdDevolver = 1) {
    const reg = vasilhames.find(v => v.id === id);
    if (!reg || reg.qtdPendente <= 0 || salvandoOperacao) return;
    const qtdReal = Math.min(reg.qtdPendente, Math.max(1, qtdDevolver));
    const novaQtd = reg.qtdPendente - qtdReal;

    salvandoOperacao = true;
    try {
        if (novaQtd === 0) {
            await supabaseClient.from('vasilhames').delete().eq('id', id);
            notificar(`Todos os cascos de "${reg.cliente}" foram devolvidos.`, 'sucesso');
        } else {
            await supabaseClient.from('vasilhames').update({ qtd_pendente: novaQtd }).eq('id', id);
            notificar(`${qtdReal} casco(s) devolvido(s) de "${reg.cliente}". Restam ${novaQtd}.`, 'info');
        }
        await carregarDadosDoBanco();
    } finally {
        salvandoOperacao = false;
    }
}

async function devolverParcialCascos(id) {
    const reg = vasilhames.find(v => v.id === id);
    if (!reg || salvandoOperacao) return;
    const qtd = parseInt(prompt(`Quantos cascos de "${reg.tipo}" voltaram de "${reg.cliente}"? (Pendentes: ${reg.qtdPendente})`, '1'), 10);
    if (isNaN(qtd) || qtd <= 0) return;
    if (qtd > reg.qtdPendente) return notificar(`Quantidade maior que o pendente (${reg.qtdPendente}).`, 'alerta');
    await devolverCasco(id, qtd);
}

async function devolverTodosCascos(id) {
    const reg = vasilhames.find(v => v.id === id);
    if (!reg || salvandoOperacao) return;
    if (!confirm(`Confirmar devolução de todos os ${reg.qtdPendente} casco(s) de "${reg.cliente}"?`)) return;
    await devolverCasco(id, reg.qtdPendente);
}

async function excluirVasilhame(id) {
    if (salvandoOperacao) return;
    if (!confirm('Excluir registro de vasilhame?')) return;
    salvandoOperacao = true;
    try {
        await supabaseClient.from('vasilhames').delete().eq('id', id);
        await carregarDadosDoBanco();
        notificar('Registro de vasilhame removido.', 'info');
    } finally {
        salvandoOperacao = false;
    }
}

function renderizarResumoClientesVasilhames() {
    const box = document.getElementById('resumo-clientes-vasilhames');
    if (!box) return;
    const mapa = new Map();
    vasilhames.forEach(v => {
        if (v.qtdPendente > 0) {
            mapa.set(v.cliente, (mapa.get(v.cliente) || 0) + v.qtdPendente);
        }
    });
    if (mapa.size === 0) {
        box.innerHTML = `<span class="chip-neutro">Nenhum casco em aberto por cliente</span>`;
        return;
    }
    box.innerHTML = Array.from(mapa.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([cliente, total]) => `<span class="chip-alerta"><strong>${cliente}:</strong> ${total} casco(s)</span>`)
        .join('');
}

function renderizarVasilhames() {
    renderizarResumoClientesVasilhames();
    const tbody = document.getElementById('tabela-vasilhames-corpo');
    const busca = (document.getElementById('busca-vasilhames')?.value || '').toLowerCase();
    tbody.innerHTML = '';
    const filtrados = vasilhames.filter(v => v.cliente.toLowerCase().includes(busca) || v.tipo.toLowerCase().includes(busca));
    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding: 24px;">Nenhum vasilhame encontrado.</td></tr>`;
        return;
    }
    filtrados.forEach(reg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${reg.cliente}</strong><br><small style="color:#64748b">${reg.data}</small></td>
            <td>${reg.tipo}</td>
            <td><strong>${reg.qtdPendente}</strong> un/cx</td>
            <td><span class="badge alerta">Pendente: ${reg.qtdPendente}</span></td>
            <td class="acoes-tabela">
                <button class="btn-mini acao-ok" onclick="devolverCasco(${reg.id}, 1)">+1</button>
                ${reg.qtdPendente > 1 ? `<button class="btn-mini" onclick="devolverParcialCascos(${reg.id})">-Qtd</button>` : ''}
                ${reg.qtdPendente > 1 ? `<button class="btn-mini" onclick="devolverTodosCascos(${reg.id})">Devolver Tudo</button>` : ''}
                <button class="btn-mini perigo" onclick="excluirVasilhame(${reg.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// FIADO
document.getElementById('form-fiado').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!usuarioAtual || salvandoOperacao) return;

    salvandoOperacao = true;
    try {
        await supabaseClient.from('fiados').insert({
            id: gerarIdUnico(),
            user_id: usuarioAtual.id,
            pedido_id: null,
            cliente: document.getElementById('fia-cliente').value.trim(),
            descricao: document.getElementById('fia-descricao').value.trim(),
            valor: parseFloat(document.getElementById('fia-valor').value) || 0,
            data: new Date().toLocaleDateString('pt-BR'),
            pago: false
        });
        this.reset();
        await carregarDadosDoBanco();
        notificar('Nota salva na caderneta!', 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
});

async function quitarFiado(id) {
    const registro = fiados.find(f => f.id === id);
    if (!registro || salvandoOperacao) return;
    if (!confirm(`Confirmar pagamento de ${formatarMoeda(registro.valor)} de "${registro.cliente}"?`)) return;

    salvandoOperacao = true;
    try {
        await supabaseClient.from('fiados').update({ pago: true }).eq('id', id);
        if (registro.pedidoId) {
            await supabaseClient.from('pedidos').update({ pagamento: 'Já Pago (PIX)' }).eq('id', registro.pedidoId);
        }
        registrarMovimentacao('Recebimento', `Fiado quitado: ${registro.cliente} (${formatarMoeda(registro.valor)})`);
        await carregarDadosDoBanco();
        notificar(`Nota de "${registro.cliente}" marcada como paga!`, 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
}

async function excluirFiado(id) {
    if (salvandoOperacao) return;
    const registro = fiados.find(f => f.id === id);
    if (!confirm(`Excluir nota de "${registro ? registro.cliente : 'cliente'}" (${registro ? formatarMoeda(registro.valor) : ''}) da caderneta?`)) return;
    salvandoOperacao = true;
    try {
        await supabaseClient.from('fiados').delete().eq('id', id);
        await carregarDadosDoBanco();
        notificar('Lançamento removido da caderneta.', 'info');
    } finally {
        salvandoOperacao = false;
    }
}

function renderizarResumoClientesFiado() {
    const box = document.getElementById('resumo-clientes-fiado');
    if (!box) return;
    const mapa = new Map();
    fiados.filter(f => !f.pago).forEach(f => {
        mapa.set(f.cliente, (mapa.get(f.cliente) || 0) + f.valor);
    });
    if (mapa.size === 0) {
        box.innerHTML = `<span class="chip-neutro">Nenhuma conta em aberto na caderneta</span>`;
        return;
    }
    box.innerHTML = Array.from(mapa.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([cliente, total]) => `<span class="chip-perigo"><strong>${cliente}:</strong> ${formatarMoeda(total)}</span>`)
        .join('');
}

function renderizarFiados() {
    renderizarResumoClientesFiado();
    const tbody = document.getElementById('tabela-fiados-corpo');
    const filtro = document.getElementById('filtro-fiado')?.value || 'ABERTO';
    tbody.innerHTML = '';
    const filtrados = fiados.filter(f => filtro === 'ABERTO' ? !f.pago : (filtro === 'PAGO' ? f.pago : true));
    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding: 24px;">Nenhuma nota encontrada.</td></tr>`;
        return;
    }
    filtrados.forEach(f => {
        const tr = document.createElement('tr');
        if (f.pago) tr.style.opacity = '0.72';
        tr.innerHTML = `
            <td><strong>${f.cliente}</strong><br><small style="color:#64748b">${f.data}</small></td>
            <td>${f.descricao}</td>
            <td><strong>${formatarMoeda(f.valor)}</strong></td>
            <td>${f.pago ? `<span class="badge ok">✔️ Pago</span>` : `<span class="badge vencido">⏳ Em Aberto</span>`}</td>
            <td class="acoes-tabela">
                ${!f.pago ? `<button class="btn-mini acao-ok" onclick="quitarFiado(${f.id})">💵 Receber</button>` : ''}
                <button class="btn-mini perigo" onclick="excluirFiado(${f.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// FORNECEDORES
document.getElementById('form-fornecedor').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!usuarioAtual || salvandoOperacao) return;

    salvandoOperacao = true;
    try {
        await supabaseClient.from('fornecedores').insert({
            id: gerarIdUnico(),
            user_id: usuarioAtual.id,
            nome: document.getElementById('forn-nome').value.trim(),
            ramo: document.getElementById('forn-ramo').value,
            contato: document.getElementById('forn-contato').value.trim() || 'Não informado',
            obs: document.getElementById('forn-obs').value.trim() || '—'
        });
        this.reset();
        await carregarDadosDoBanco();
        notificar('Fornecedor cadastrado!', 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
});

async function editarFornecedorRapido(id) {
    const f = fornecedores.find(item => item.id === id);
    if (!f || salvandoOperacao) return;
    const novoContato = prompt(`Contato de "${f.nome}":`, f.contato === 'Não informado' ? '' : f.contato);
    if (novoContato === null) return;
    const novaObs = prompt(`Observação de "${f.nome}":`, f.obs === '—' ? '' : f.obs);
    if (novaObs === null) return;

    salvandoOperacao = true;
    try {
        await supabaseClient.from('fornecedores').update({
            contato: novoContato.trim() || 'Não informado',
            obs: novaObs.trim() || '—'
        }).eq('id', id);
        await carregarDadosDoBanco();
        notificar(`Fornecedor "${f.nome}" atualizado!`, 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
}

async function excluirFornecedor(id) {
    if (salvandoOperacao) return;
    if (!confirm('Remover este fornecedor?')) return;
    salvandoOperacao = true;
    try {
        await supabaseClient.from('fornecedores').delete().eq('id', id);
        await carregarDadosDoBanco();
        notificar('Fornecedor removido.', 'info');
    } finally {
        salvandoOperacao = false;
    }
}

function renderizarFornecedores() {
    const tbody = document.getElementById('tabela-fornecedores-corpo');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (fornecedores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding: 24px;">Nenhum fornecedor cadastrado ainda.</td></tr>`;
        return;
    }
    fornecedores.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${f.nome}</strong><br><small style="color:#64748b">${f.ramo}</small></td>
            <td>${f.contato}</td>
            <td>${f.obs}</td>
            <td class="acoes-tabela">
                <button class="btn-mini" onclick="editarFornecedorRapido(${f.id})">✏️</button>
                <button class="btn-mini perigo" onclick="excluirFornecedor(${f.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// CAIXA & FECHAMENTO
function obterTotaisFinanceiros() {
    const jaPago = pedidos.filter(p => p.pagamento === 'Já Pago (PIX)').reduce((s, p) => s + p.valorTotal, 0)
        + fiados.filter(f => f.pago).reduce((s, f) => s + f.valor, 0);
    const cobrarMaquininha = pedidos.filter(p => p.pagamento === 'Cobrar Maquininha').reduce((s, p) => s + p.valorTotal, 0);
    const cobrarDinheiro = pedidos.filter(p => p.pagamento === 'Cobrar Dinheiro').reduce((s, p) => s + p.valorTotal, 0);
    const fiadoEmAberto = fiados.filter(f => !f.pago).reduce((s, f) => s + f.valor, 0);
    const impostoTotalEstimado = pedidos.reduce((s, p) => s + p.impostoEstimado, 0);
    const lucroLiquidoTotal = pedidos.reduce((s, p) => s + p.lucroLiquidoEstimado, 0);
    const aReceberNaRota = cobrarMaquininha + cobrarDinheiro;

    return { jaPago, cobrarMaquininha, cobrarDinheiro, fiadoEmAberto, impostoTotalEstimado, lucroLiquidoTotal, aReceberNaRota };
}

async function realizarFechamentoCaixa() {
    if (!usuarioAtual || salvandoOperacao) return;
    const t = obterTotaisFinanceiros();
    const entreguesQtd = pedidos.filter(p => p.status === 'Entregue').length;
    const registro = {
        id: gerarIdUnico(),
        user_id: usuarioAtual.id,
        data_hora: new Date().toLocaleString('pt-BR'),
        ja_pago: t.jaPago,
        maquininha: t.cobrarMaquininha,
        dinheiro: t.cobrarDinheiro,
        fiado: t.fiadoEmAberto,
        imposto_estimado: t.impostoTotalEstimado,
        lucro_estimado: t.lucroLiquidoTotal,
        entregues_qtd: entreguesQtd,
        total_pedidos: pedidos.length
    };

    salvandoOperacao = true;
    try {
        const { error } = await supabaseClient.from('fechamentos_caixa').insert(registro);
        if (error) {
            return notificar('Erro ao salvar fechamento no banco: ' + error.message, 'erro');
        }
        registrarMovimentacao('Fechamento', `Caixa salvo no banco: ${formatarMoeda(t.jaPago)} pagos (${entreguesQtd} entregues)`);
        await carregarDadosDoBanco();
        notificar('Fechamento salvo na nuvem (sobrevive ao F5)!', 'sucesso');
    } finally {
        salvandoOperacao = false;
    }
}

async function excluirFechamento(id) {
    if (!usuarioAtual || salvandoOperacao) return;
    const item = historicoFechamentos.find(h => h.id === id);
    if (!confirm(`Remover o fechamento salvo de "${item ? item.dataHora : 'registro'}"?`)) return;
    salvandoOperacao = true;
    try {
        await supabaseClient.from('fechamentos_caixa').delete().eq('id', id);
        await carregarDadosDoBanco();
        notificar('Registro de fechamento removido.', 'info');
    } finally {
        salvandoOperacao = false;
    }
}

function renderizarHistoricoFechamentos() {
    const container = document.getElementById('historico-fechamentos');
    if (!container) return;
    if (historicoFechamentos.length === 0) {
        container.innerHTML = `<p style="color:#64748b; font-size:0.86rem;">Nenhum fechamento salvo na nuvem ainda.</p>`;
        return;
    }
    container.innerHTML = historicoFechamentos.map(h => `
        <div class="fechamento-item">
            <div>
                <strong>🔒 ${h.dataHora}</strong>
                <small style="display:block; color:#64748b;">Entregues: ${h.entreguesQtd}/${h.totalPedidos || h.entreguesQtd} • Maquininha: ${formatarMoeda(h.maquininha)} • Dinheiro: ${formatarMoeda(h.dinheiro)} • Fiado: ${formatarMoeda(h.fiado)}</small>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="text-align:right;">
                    <strong style="color:#15803d;">Pago: ${formatarMoeda(h.jaPago)}</strong>
                    <small style="display:block; color:#0369a1;">Lucro est.: ${formatarMoeda(h.lucro)}</small>
                </div>
                <button class="btn-mini perigo" title="Excluir fechamento" onclick="excluirFechamento(${h.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function renderizarFechamentoCaixa() {
    const t = obterTotaisFinanceiros();
    document.getElementById('caixa-pago').textContent = formatarMoeda(t.jaPago);
    document.getElementById('caixa-maquininha').textContent = formatarMoeda(t.cobrarMaquininha);
    document.getElementById('caixa-dinheiro').textContent = formatarMoeda(t.cobrarDinheiro);
    document.getElementById('caixa-fiado').textContent = formatarMoeda(t.fiadoEmAberto);
    document.getElementById('caixa-imposto').textContent = formatarMoeda(t.impostoTotalEstimado);
    document.getElementById('caixa-lucro').textContent = formatarMoeda(t.lucroLiquidoTotal);
}

function atualizarPainelVisualDashboard() {
    const t = obterTotaisFinanceiros();
    const somaFinanceira = Math.max(0.01, t.jaPago + t.aReceberNaRota + t.fiadoEmAberto);

    const pctPago = Math.round((t.jaPago / somaFinanceira) * 100);
    const pctRota = Math.round((t.aReceberNaRota / somaFinanceira) * 100);
    const pctFiado = Math.max(0, 100 - pctPago - pctRota);

    const barPago = document.getElementById('barra-fin-pago');
    const barRota = document.getElementById('barra-fin-rota');
    const barFiado = document.getElementById('barra-fin-fiado');
    if (barPago) barPago.style.width = `${pctPago}%`;
    if (barRota) barRota.style.width = `${pctRota}%`;
    if (barFiado) barFiado.style.width = `${pctFiado}%`;

    const legPago = document.getElementById('legenda-fin-pago');
    const legRota = document.getElementById('legenda-fin-rota');
    const legFiado = document.getElementById('legenda-fin-fiado');
    if (legPago) legPago.textContent = `Pago: ${formatarMoeda(t.jaPago)} (${pctPago}%)`;
    if (legRota) legRota.textContent = `Em rota: ${formatarMoeda(t.aReceberNaRota)} (${pctRota}%)`;
    if (legFiado) legFiado.textContent = `Fiado: ${formatarMoeda(t.fiadoEmAberto)} (${pctFiado}%)`;

    const totalPed = pedidos.length;
    const entreguesQtd = pedidos.filter(p => p.status === 'Entregue').length;
    const pctEntregue = totalPed > 0 ? Math.round((entreguesQtd / totalPed) * 100) : 0;

    const barEnt = document.getElementById('barra-entregas-progresso');
    const txtEnt = document.getElementById('texto-entregas-progresso');
    if (barEnt) barEnt.style.width = `${pctEntregue}%`;
    if (txtEnt) txtEnt.textContent = `${entreguesQtd} de ${totalPed} pedidos entregues (${pctEntregue}%)`;

    const lucroDash = document.getElementById('dash-lucro-estimado');
    if (lucroDash) lucroDash.textContent = formatarMoeda(t.lucroLiquidoTotal);
}

function atualizarResumoGeral() {
    const totalItens = estoque.reduce((s, item) => s + item.quantidade, 0);
    const lotesCriticos = estoque.filter(item => item.quantidade > 0 && calcularDiasParaVencer(item.validade) <= 15).length;
    const entregasPendentes = pedidos.filter(ped => ped.status !== 'Entregue' && !ped.ocultoFila).length;
    const totalCascosPendentes = vasilhames.reduce((s, v) => s + v.qtdPendente, 0);
    const faturamentoTotal = pedidos.reduce((s, ped) => s + ped.valorTotal, 0);
    const aCobrarNaRua = pedidos.filter(ped => ped.status !== 'Entregue' && ped.pagamento.includes('Cobrar')).reduce((s, ped) => s + ped.valorTotal, 0);
    const totalFiadoAberto = fiados.filter(f => !f.pago).reduce((s, f) => s + f.valor, 0);

    document.getElementById('resumo-produtos').textContent = `${totalItens} itens`;
    document.getElementById('resumo-vencendo').textContent = `${lotesCriticos} lotes`;
    document.getElementById('resumo-entregas').textContent = `${entregasPendentes} pedidos`;
    document.getElementById('resumo-faturamento').textContent = formatarMoeda(faturamentoTotal);
    document.getElementById('resumo-cobrar').textContent = `A cobrar em rota: ${formatarMoeda(aCobrarNaRua)}`;
    document.getElementById('resumo-vasilhames').textContent = `${totalCascosPendentes} cascos`;
    document.getElementById('resumo-fiado').textContent = formatarMoeda(totalFiadoAberto);

    renderizarRadarAlertas();
    atualizarPainelVisualDashboard();
}

function renderizarRadarAlertas() {
    const lista = document.getElementById('lista-alertas-radar');
    lista.innerHTML = '';
    const alertas = [];

    estoque.forEach(item => {
        if (item.quantidade === 0) return;
        const dias = calcularDiasParaVencer(item.validade);
        if (dias < 0) alertas.push(`🔴 <strong>VENCIDO:</strong> ${item.nome} (${item.quantidade} ${item.unidade}) venceu há ${Math.abs(dias)}d.`);
        else if (dias <= 15) alertas.push(`🟡 <strong>VENCENDO:</strong> ${item.nome} (${item.quantidade} ${item.unidade}) vence em ${dias}d.`);
        if (item.quantidade <= 5) alertas.push(`🟠 <strong>ESTOQUE BAIXO:</strong> Restam ${item.quantidade} ${item.unidade} de ${item.nome}.`);
    });
    vasilhames.forEach(v => { if (v.qtdPendente > 0) alertas.push(`🟣 <strong>CASCO PENDENTE:</strong> ${v.cliente} está com ${v.qtdPendente}x ${v.tipo}.`); });
    fiados.forEach(f => { if (!f.pago) alertas.push(`📒 <strong>NOTA EM ABERTO:</strong> ${f.cliente} deve ${formatarMoeda(f.valor)} (${f.descricao}).`); });

    lista.innerHTML = alertas.length === 0
        ? `<li class="alerta-ok">✅ Tudo sob controle no momento!</li>`
        : alertas.map(t => `<li>${t}</li>`).join('');
}

function exportarBackup() {
    const dados = {
        dataExportacao: new Date().toISOString(),
        estoque,
        pedidos,
        vasilhames,
        fiados,
        fornecedores,
        catalogoPersonalizado,
        historicoFechamentos
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-gestaofacil-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notificar('Backup JSON exportado!', 'sucesso');
}

async function restaurarBackupJson(event) {
    const file = event.target.files?.[0];
    if (!file || !usuarioAtual || salvandoOperacao) return;

    try {
        const texto = await file.text();
        const dados = JSON.parse(texto);
        if (!confirm('Importar os registros deste backup para a sua conta na nuvem?')) return;

        salvandoOperacao = true;
        if (Array.isArray(dados.fornecedores) && dados.fornecedores.length) {
            await supabaseClient.from('fornecedores').upsert(dados.fornecedores.map(f => ({
                id: f.id || gerarIdUnico(),
                user_id: usuarioAtual.id,
                nome: f.nome,
                ramo: f.ramo || 'Atacado Geral',
                contato: f.contato || 'Não informado',
                obs: f.obs || '—'
            })));
        }
        if (Array.isArray(dados.estoque) && dados.estoque.length) {
            await supabaseClient.from('estoque').upsert(dados.estoque.map(e => ({
                id: e.id || gerarIdUnico(),
                user_id: usuarioAtual.id,
                nome: e.nome,
                categoria: e.categoria || 'Bebidas',
                fornecedor: e.fornecedor || null,
                local: e.local || 'Depósito',
                unidade: e.unidade || 'cx',
                ncm: e.ncm || '2202.10.00',
                cfop: e.cfop || '5102',
                imposto_pct: Number(e.impostoPct) || 0,
                quantidade: Number(e.quantidade) || 0,
                custo: Number(e.custo) || 0,
                preco: Number(e.preco) || 0,
                validade: e.validade || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
            })));
        }
        if (Array.isArray(dados.pedidos) && dados.pedidos.length) {
            await supabaseClient.from('pedidos').upsert(dados.pedidos.map(p => ({
                id: p.id || gerarIdUnico(),
                user_id: usuarioAtual.id,
                cliente: p.cliente,
                doc_cliente: p.docCliente || 'Não informado',
                cep: p.cep || 'Não informado',
                endereco: p.endereco,
                numero_nf: p.numeroNf || 'Pendente',
                produto_nome: p.produtoNome,
                unidade: p.unidade || 'un',
                ncm: p.ncm || '2202.10.00',
                cfop: p.cfop || '5102',
                lote_id: p.loteId || null,
                quantidade: Number(p.quantidade) || 1,
                valor_total: Number(p.valorTotal) || 0,
                imposto_estimado: Number(p.impostoEstimado) || 0,
                lucro_liquido_estimado: Number(p.lucroLiquidoEstimado) || 0,
                frota: p.frota || '🏍️ Moto 01 (Rápida)',
                pagamento: p.pagamento || 'Cobrar Maquininha',
                status: p.ocultoFila && p.status === 'Entregue' ? 'Entregue / Arquivado' : (p.status || 'Separando'),
                hora: p.hora || ''
            })));
        }
        if (Array.isArray(dados.vasilhames) && dados.vasilhames.length) {
            await supabaseClient.from('vasilhames').upsert(dados.vasilhames.map(v => ({
                id: v.id || gerarIdUnico(),
                user_id: usuarioAtual.id,
                cliente: v.cliente,
                tipo: v.tipo,
                qtd_pendente: Number(v.qtdPendente) || 0,
                data: v.data || new Date().toLocaleDateString('pt-BR')
            })));
        }
        if (Array.isArray(dados.fiados) && dados.fiados.length) {
            await supabaseClient.from('fiados').upsert(dados.fiados.map(f => ({
                id: f.id || gerarIdUnico(),
                user_id: usuarioAtual.id,
                pedido_id: f.pedidoId || null,
                cliente: f.cliente,
                descricao: f.descricao,
                valor: Number(f.valor) || 0,
                data: f.data || new Date().toLocaleDateString('pt-BR'),
                pago: Boolean(f.pago)
            })));
        }
        if (Array.isArray(dados.catalogoPersonalizado) && dados.catalogoPersonalizado.length) {
            await supabaseClient.from('catalogo_custom').upsert(dados.catalogoPersonalizado.map(c => ({
                user_id: usuarioAtual.id,
                nome: c.nome,
                categoria: c.categoria || 'Bebidas',
                local: c.local || 'Depósito',
                unidade: c.unidade || 'cx',
                custo: Number(c.custo) || 0,
                preco: Number(c.preco) || 0,
                ncm: c.ncm || '2202.10.00',
                cfop: c.cfop || '5102',
                imposto_pct: Number(c.impostoPct) || 0
            })), { onConflict: 'user_id,nome' });
        }
        if (Array.isArray(dados.historicoFechamentos) && dados.historicoFechamentos.length) {
            await supabaseClient.from('fechamentos_caixa').upsert(dados.historicoFechamentos.map(f => ({
                id: f.id || gerarIdUnico(),
                user_id: usuarioAtual.id,
                data_hora: f.dataHora || new Date().toLocaleString('pt-BR'),
                ja_pago: Number(f.jaPago) || 0,
                maquininha: Number(f.maquininha) || 0,
                dinheiro: Number(f.dinheiro) || 0,
                fiado: Number(f.fiado) || 0,
                imposto_estimado: Number(f.impostoEstimado) || 0,
                lucro_estimado: Number(f.lucro) || 0,
                entregues_qtd: Number(f.entreguesQtd) || 0,
                total_pedidos: Number(f.totalPedidos) || 0
            })));
        }

        await carregarDadosDoBanco();
        notificar('Backup restaurado com sucesso!', 'sucesso');
    } catch (_err) {
        notificar('Arquivo JSON inválido ou corrompido.', 'erro');
    } finally {
        event.target.value = '';
        salvandoOperacao = false;
    }
}

// AUTH FORM
document.getElementById('form-auth').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const senha = document.getElementById('auth-senha').value;
    const msg = document.getElementById('auth-mensagem');
    msg.textContent = 'Entrando...';

    const res = await fazerLogin(email, senha);
    msg.textContent = res.ok ? '' : res.mensagem;
});

document.getElementById('btn-cadastrar').addEventListener('click', async function() {
    const email = document.getElementById('auth-email').value;
    const senha = document.getElementById('auth-senha').value;
    const msg = document.getElementById('auth-mensagem');
    if (!email || senha.length < 6) {
        msg.textContent = 'Preencha um e-mail válido e senha de pelo menos 6 caracteres.';
        return;
    }
    msg.textContent = 'Criando conta...';
    const res = await criarConta(email, senha);
    msg.textContent = res.mensagem || '';
});

=======
let estoque = [];
let pedidos = [];
let vasilhames = [];
let fiados = [];
let fornecedores = [];
let catalogoPersonalizado = [];

const CATALOGO_BASE = [
    { nome: 'Cerveja Lata 350ml (Fardo 12)', categoria: 'Cervejas', local: 'Câmara Fria', unidade: 'fd', custo: 31.50, preco: 42.90, ncm: '2203.00.00', cfop: '5405', impostoPct: 0 },
    { nome: 'Cerveja 600ml Retornável (Cx 24)', categoria: 'Cervejas', local: 'Depósito / Rua A', unidade: 'cx', custo: 148.00, preco: 192.00, ncm: '2203.00.00', cfop: '5405', impostoPct: 0 },
    { nome: 'Refrigerante Cola 2L (Fardo 6)', categoria: 'Refrigerantes & Sucos', local: 'Rua B', unidade: 'fd', custo: 42.00, preco: 57.00, ncm: '2202.10.00', cfop: '5405', impostoPct: 0 },
    { nome: 'Água Mineral Galão 20L', categoria: 'Água & Gás', local: 'Área Água', unidade: 'gl', custo: 8.50, preco: 16.00, ncm: '2201.10.00', cfop: '5102', impostoPct: 0 },
    { nome: 'Botijão de Gás GLP P13', categoria: 'Água & Gás', local: 'Gaiola Gás', unidade: 'un', custo: 78.00, preco: 110.00, ncm: '2711.19.10', cfop: '5656', impostoPct: 0 }
];

const opcoesData = { weekday: 'long', day: 'numeric', month: 'long' };
document.getElementById('data-atual').textContent = new Date().toLocaleDateString('pt-BR', opcoesData);

function formatarMoeda(valor) {
    return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarTela(nomeTela, botaoClicado) {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('ativa'));
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tela-' + nomeTela).classList.add('ativa');
    botaoClicado.classList.add('active');

    const titulos = {
        'visao-geral': 'Visão Geral do Negócio',
        'estoque': 'Controle de Estoque & Catálogo',
        'entregas': 'Pedidos, Frota & Espelho de Nota',
        'vasilhames': 'Controle de Vasilhames & Cascos',
        'fiado': 'Caderneta Digital (Fiado / Notas)',
        'fornecedores': 'Fornecedores & Distribuidoras',
        'caixa': 'Fechamento de Caixa & Resumo'
    };
    document.getElementById('titulo-pagina').textContent = titulos[nomeTela];
}

function calcularDiasParaVencer(dataValidade) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(dataValidade + 'T00:00:00');
    return Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
}

function obterCatalogoCompleto() {
    return [
        ...CATALOGO_BASE.map(item => ({ ...item, origem: 'Padrão' })),
        ...catalogoPersonalizado.map(item => ({ ...item, origem: 'Meu Catálogo' }))
    ];
}

function preencherCatalogoSelect() {
    const select = document.getElementById('catalogo-rapido');
    if (!select) return;
    const lista = obterCatalogoCompleto();
    select.innerHTML = `<option value="">-- Escolha um produto do catálogo ou digite livremente --</option>`;
    lista.forEach((prod, idx) => {
        const tag = prod.origem === 'Meu Catálogo' ? ' [Salvo]' : '';
        select.innerHTML += `<option value="${idx}">${prod.nome}${tag} (${formatarMoeda(prod.preco)})</option>`;
    });
}

function aplicarProdutoCatalogo() {
    const idx = document.getElementById('catalogo-rapido').value;
    if (idx === '') return;
    const prod = obterCatalogoCompleto()[parseInt(idx)];
    if (!prod) return;

    document.getElementById('prod-nome').value = prod.nome;
    document.getElementById('prod-categoria').value = prod.categoria;
    document.getElementById('prod-local').value = prod.local || 'Depósito';
    document.getElementById('prod-unidade').value = prod.unidade || 'cx';
    document.getElementById('prod-custo').value = prod.custo || '';
    document.getElementById('prod-preco').value = prod.preco || '';
    document.getElementById('prod-ncm').value = prod.ncm || '';
    document.getElementById('prod-cfop').value = prod.cfop || '';
    document.getElementById('prod-imposto').value = prod.impostoPct || 0;
    document.getElementById('prod-qtd').focus();
}

async function salvarNoMeuCatalogo() {
    if (!usuarioAtual) return;
    const nome = document.getElementById('prod-nome').value.trim();
    if (!nome) {
        alert('Digite o nome do produto antes de salvar no seu catálogo.');
        return;
    }

    const item = {
        user_id: usuarioAtual.id,
        nome,
        categoria: document.getElementById('prod-categoria').value,
        local: document.getElementById('prod-local').value.trim() || 'Depósito',
        unidade: document.getElementById('prod-unidade').value,
        custo: parseFloat(document.getElementById('prod-custo').value) || 0,
        preco: parseFloat(document.getElementById('prod-preco').value) || 0,
        ncm: document.getElementById('prod-ncm').value.trim() || '2202.10.00',
        cfop: document.getElementById('prod-cfop').value.trim() || '5102',
        imposto_pct: parseFloat(document.getElementById('prod-imposto').value) || 0
    };

    const { error } = await supabaseClient
        .from('catalogo_custom')
        .upsert(item, { onConflict: 'user_id,nome' });

    if (error) {
        alert('Erro ao salvar no catálogo: ' + error.message);
        return;
    }

    await carregarDadosDoBanco();
    alert(`"${nome}" salvo no seu catálogo na nuvem!`);
}

function atualizarSelectFornecedores() {
    const select = document.getElementById('prod-fornecedor');
    if (!select) return;
    select.innerHTML = `<option value="">Fornecedor não informado</option>`;
    fornecedores.forEach(f => {
        select.innerHTML += `<option value="${f.nome}">${f.nome} (${f.ramo})</option>`;
    });
}

async function buscarCepPedido() {
    const campoCep = document.getElementById('ped-cep');
    const cepLimpo = campoCep.value.replace(/\D/g, '');
    const statusCep = document.getElementById('status-cep');
    if (cepLimpo.length !== 8) return;

    statusCep.textContent = 'Buscando CEP...';
    try {
        const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const dados = await resp.json();
        if (dados.erro) {
            statusCep.textContent = 'CEP não encontrado.';
            return;
        }
        const enderecoAtual = document.getElementById('ped-endereco').value.trim();
        const baseEndereco = `${dados.logradouro}${dados.bairro ? ', ' + dados.bairro : ''}${dados.localidade ? ' - ' + dados.localidade + '/' + dados.uf : ''}`;
        if (!enderecoAtual) {
            document.getElementById('ped-endereco').value = baseEndereco;
        } else if (!enderecoAtual.includes(dados.localidade || '')) {
            document.getElementById('ped-endereco').value = `${enderecoAtual} (${baseEndereco})`;
        }
        statusCep.textContent = `✓ ${dados.localidade || ''}/${dados.uf || ''}`;
    } catch (_e) {
        statusCep.textContent = 'Sem internet para CEP.';
    }
}

function baixarCsvExcel(nomeArquivo, linhas) {
    const conteudo = linhas
        .map(colunas => colunas.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');
    const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
}

function exportarEstoqueExcel() {
    if (estoque.length === 0) return alert('Não há itens no estoque para exportar.');
    const linhas = [['Produto', 'Categoria', 'Fornecedor', 'Local', 'Unidade', 'Quantidade', 'Custo Unit. (R$)', 'Venda Unit. (R$)', 'Imposto Est. (%)', 'Validade', 'NCM', 'CFOP']];
    estoque.forEach(item => {
        const validadeFmt = new Date(item.validade + 'T00:00:00').toLocaleDateString('pt-BR');
        linhas.push([
            item.nome, item.categoria, item.fornecedor || '', item.local || 'Depósito', item.unidade || 'un',
            item.quantidade, Number(item.custo || 0).toFixed(2).replace('.', ','),
            Number(item.preco || 0).toFixed(2).replace('.', ','),
            Number(item.impostoPct || 0).toString().replace('.', ','), validadeFmt, item.ncm || '', item.cfop || ''
        ]);
    });
    baixarCsvExcel(`estoque-gestaofacil-${new Date().toISOString().slice(0, 10)}.csv`, linhas);
}

function exportarPedidosExcel() {
    if (pedidos.length === 0) return alert('Não há pedidos lançados para exportar.');
    const linhas = [['Hora', 'Cliente', 'CPF/CNPJ', 'CEP', 'Endereco', 'NF', 'Produto', 'Unidade', 'Quantidade', 'Valor Total (R$)', 'Frota', 'Pagamento', 'Status']];
    pedidos.forEach(ped => {
        linhas.push([
            ped.hora || '', ped.cliente, ped.docCliente || '', ped.cep || '', ped.endereco,
            ped.numeroNf || '', ped.produtoNome, ped.unidade || 'un', ped.quantidade,
            Number(ped.valorTotal || 0).toFixed(2).replace('.', ','), ped.frota, ped.pagamento, ped.status
        ]);
    });
    baixarCsvExcel(`pedidos-gestaofacil-${new Date().toISOString().slice(0, 10)}.csv`, linhas);
}

function renderizarTudo() {
    atualizarSelectFornecedores();
    preencherCatalogoSelect();
    renderizarEstoque();
    atualizarSelectProdutosPedido();
    renderizarPedidos();
    renderizarVasilhames();
    renderizarFiados();
    renderizarFornecedores();
    renderizarFechamentoCaixa();
    atualizarResumoGeral();
}

async function carregarDadosDoBanco() {
    if (!usuarioAtual) return;

    const [resEst, resPed, resVas, resFia, resForn, resCat] = await Promise.all([
        supabaseClient.from('estoque').select('*').order('validade', { ascending: true }),
        supabaseClient.from('pedidos').select('*').order('id', { ascending: false }),
        supabaseClient.from('vasilhames').select('*').order('id', { ascending: false }),
        supabaseClient.from('fiados').select('*').order('id', { ascending: false }),
        supabaseClient.from('fornecedores').select('*').order('id', { ascending: false }),
        supabaseClient.from('catalogo_custom').select('*').order('nome', { ascending: true })
    ]);

    estoque = (resEst.data || []).map(r => ({
        id: r.id, nome: r.nome, categoria: r.categoria, fornecedor: r.fornecedor || '',
        local: r.local || 'Depósito', unidade: r.unidade || 'cx', ncm: r.ncm || '',
        cfop: r.cfop || '', impostoPct: Number(r.imposto_pct) || 0,
        quantidade: Number(r.quantidade) || 0, custo: Number(r.custo) || 0,
        preco: Number(r.preco) || 0, validade: r.validade
    }));

    pedidos = (resPed.data || []).map(r => ({
        id: r.id, cliente: r.cliente, docCliente: r.doc_cliente || 'Não informado',
        cep: r.cep || 'Não informado', endereco: r.endereco, numeroNf: r.numero_nf || 'Pendente',
        produtoNome: r.produto_nome, unidade: r.unidade || 'un', ncm: r.ncm || '',
        cfop: r.cfop || '', loteId: r.lote_id, quantidade: Number(r.quantidade) || 1,
        valorTotal: Number(r.valor_total) || 0, impostoEstimado: Number(r.imposto_estimado) || 0,
        lucroLiquidoEstimado: Number(r.lucro_liquido_estimado) || 0,
        frota: r.frota, pagamento: r.pagamento, status: r.status, hora: r.hora || ''
    }));

    vasilhames = (resVas.data || []).map(r => ({
        id: r.id, cliente: r.cliente, tipo: r.tipo,
        qtdPendente: Number(r.qtd_pendente) || 0, data: r.data || ''
    }));

    fiados = (resFia.data || []).map(r => ({
        id: r.id, pedidoId: r.pedido_id, cliente: r.cliente, descricao: r.descricao,
        valor: Number(r.valor) || 0, data: r.data || '', pago: Boolean(r.pago)
    }));

    fornecedores = (resForn.data || []).map(r => ({
        id: r.id, nome: r.nome, ramo: r.ramo, contato: r.contato || 'Não informado', obs: r.obs || '—'
    }));

    catalogoPersonalizado = (resCat.data || []).map(r => ({
        nome: r.nome, categoria: r.categoria, local: r.local || 'Depósito', unidade: r.unidade || 'cx',
        custo: Number(r.custo) || 0, preco: Number(r.preco) || 0, ncm: r.ncm || '',
        cfop: r.cfop || '', impostoPct: Number(r.imposto_pct) || 0
    }));

    renderizarTudo();
}

async function inicializarAppComUsuario() {
    await carregarDadosDoBanco();
}

document.getElementById('form-estoque').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!usuarioAtual) return;

    const item = {
        id: Date.now(),
        user_id: usuarioAtual.id,
        nome: document.getElementById('prod-nome').value.trim(),
        categoria: document.getElementById('prod-categoria').value,
        fornecedor: document.getElementById('prod-fornecedor').value || null,
        local: document.getElementById('prod-local').value.trim() || 'Depósito',
        unidade: document.getElementById('prod-unidade').value,
        ncm: document.getElementById('prod-ncm').value.trim() || '2202.10.00',
        cfop: document.getElementById('prod-cfop').value.trim() || '5102',
        imposto_pct: parseFloat(document.getElementById('prod-imposto').value) || 0,
        quantidade: parseInt(document.getElementById('prod-qtd').value),
        custo: parseFloat(document.getElementById('prod-custo').value) || 0,
        preco: parseFloat(document.getElementById('prod-preco').value) || 0,
        validade: document.getElementById('prod-validade').value
    };

    const { error } = await supabaseClient.from('estoque').insert(item);
    if (error) return alert('Erro ao salvar estoque: ' + error.message);

    this.reset();
    document.getElementById('catalogo-rapido').value = '';
    await carregarDadosDoBanco();
});

async function baixarUnidade(id) {
    const item = estoque.find(p => p.id === id);
    if (!item || item.quantidade <= 0) return;
    const novaQtd = item.quantidade - 1;
    if (novaQtd === 0 && confirm(`O estoque de "${item.nome}" zerou. Remover lote?`)) {
        await supabaseClient.from('estoque').delete().eq('id', id);
    } else {
        await supabaseClient.from('estoque').update({ quantidade: Math.max(0, novaQtd) }).eq('id', id);
    }
    await carregarDadosDoBanco();
}

async function reporUnidades(id) {
    const item = estoque.find(p => p.id === id);
    if (!item) return;
    const qtdAdicionar = parseInt(prompt(`Quantas unidades (${item.unidade}) entraram para "${item.nome}"?`, '10'));
    if (!isNaN(qtdAdicionar) && qtdAdicionar > 0) {
        await supabaseClient.from('estoque').update({ quantidade: item.quantidade + qtdAdicionar }).eq('id', id);
        await carregarDadosDoBanco();
    }
}

async function removerLote(id) {
    if (confirm('Excluir este registro do estoque?')) {
        await supabaseClient.from('estoque').delete().eq('id', id);
        await carregarDadosDoBanco();
    }
}

function renderizarEstoque() {
    const tbody = document.getElementById('tabela-estoque-corpo');
    const termoBusca = document.getElementById('busca-estoque').value.toLowerCase();
    const filtroTipo = document.getElementById('filtro-estoque').value;
    tbody.innerHTML = '';

    const filtrados = estoque.filter(item => {
        const bateTexto =
            item.nome.toLowerCase().includes(termoBusca) ||
            item.categoria.toLowerCase().includes(termoBusca) ||
            (item.fornecedor || '').toLowerCase().includes(termoBusca) ||
            (item.local || '').toLowerCase().includes(termoBusca) ||
            (item.ncm || '').toLowerCase().includes(termoBusca);
        if (!bateTexto) return false;
        const dias = calcularDiasParaVencer(item.validade);
        if (filtroTipo === 'vencendo') return dias <= 15;
        if (filtroTipo === 'baixo') return item.quantidade <= 5;
        return true;
    });

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding: 24px;">Nenhum produto encontrado.</td></tr>`;
        return;
    }

    filtrados.forEach(item => {
        const dias = calcularDiasParaVencer(item.validade);
        const dataFormatada = new Date(item.validade + 'T00:00:00').toLocaleDateString('pt-BR');
        let statusBadge = `<span class="badge ok">Normal (${dias}d)</span>`;
        let classeLinha = '';
        if (dias < 0) {
            statusBadge = `<span class="badge vencido">Vencido há ${Math.abs(dias)}d</span>`;
            classeLinha = 'linha-vencida';
        } else if (dias <= 15) {
            statusBadge = `<span class="badge alerta">Vence em ${dias}d!</span>`;
            classeLinha = 'linha-alerta';
        }
        const alertaEstoqueBaixo = item.quantidade <= 5 ? `<span class="tag-baixo">⚠️ Baixo</span>` : '';
        const valoresInfo = `
            ${item.preco > 0 ? `<strong>Venda: ${formatarMoeda(item.preco)}</strong>` : '<span style="color:#94a3b8">Sem venda</span>'}
            ${item.custo > 0 ? `<br><small style="color:#64748b">Custo: ${formatarMoeda(item.custo)}</small>` : ''}
            ${item.impostoPct > 0 ? `<br><small style="color:#0369a1">Imp: ${item.impostoPct}%</small>` : ''}
        `;
        const fornecedorDetalhe = item.fornecedor ? ` • 🏭 ${item.fornecedor}` : '';
        const tr = document.createElement('tr');
        tr.className = classeLinha;
        tr.innerHTML = `
            <td><strong>${item.nome}</strong><br><small style="color:#64748b">${item.categoria} • 📍 ${item.local || 'Depósito'}${fornecedorDetalhe}</small><br><small style="color:#475569">NCM: ${item.ncm || '—'} • CFOP: ${item.cfop || '—'}</small></td>
            <td><strong>${item.quantidade}</strong> ${item.unidade || 'un'} ${alertaEstoqueBaixo}</td>
            <td>${valoresInfo}</td>
            <td>${dataFormatada}</td>
            <td>${statusBadge}</td>
            <td class="acoes-tabela">
                <button class="btn-mini" onclick="reporUnidades(${item.id})">+ Repor</button>
                <button class="btn-mini" onclick="baixarUnidade(${item.id})">-1</button>
                <button class="btn-mini perigo" onclick="removerLote(${item.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function atualizarSelectProdutosPedido() {
    const select = document.getElementById('ped-produto');
    const disponiveis = estoque.filter(item => item.quantidade > 0);
    if (disponiveis.length === 0) {
        select.innerHTML = `<option value="">Sem produtos disponíveis no estoque</option>`;
        return;
    }
    select.innerHTML = `<option value="">Selecione um lote do estoque...</option>`;
    disponiveis.forEach(item => {
        const dataFormatada = new Date(item.validade + 'T00:00:00').toLocaleDateString('pt-BR');
        const precoTexto = item.preco > 0 ? ` • ${formatarMoeda(item.preco)}` : '';
        select.innerHTML += `<option value="${item.id}">${item.nome} (Disp: ${item.quantidade} ${item.unidade || 'un'} | Val: ${dataFormatada}${precoTexto})</option>`;
    });
}

document.getElementById('form-pedido').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!usuarioAtual) return;

    const cliente = document.getElementById('ped-cliente').value.trim();
    const docCliente = document.getElementById('ped-doc').value.trim() || 'Não informado';
    const cep = document.getElementById('ped-cep').value.trim() || 'Não informado';
    const endereco = document.getElementById('ped-endereco').value.trim();
    const numeroNf = document.getElementById('ped-nf').value.trim() || 'Pendente';
    const loteId = parseInt(document.getElementById('ped-produto').value);
    const qtd = parseInt(document.getElementById('ped-qtd').value);
    const frota = document.getElementById('ped-frota').value;
    const pagamento = document.getElementById('ped-pagamento').value;

    const itemEstoque = estoque.find(p => p.id === loteId);
    if (!itemEstoque) return alert('Selecione um produto válido do estoque!');
    if (qtd > itemEstoque.quantidade) return alert(`Estoque insuficiente! Disponível: ${itemEstoque.quantidade}.`);

    const valorTotal = qtd * (Number(itemEstoque.preco) || 0);
    const custoTotal = qtd * (Number(itemEstoque.custo) || 0);
    const impostoEstimado = valorTotal * ((Number(itemEstoque.impostoPct) || 0) / 100);
    const lucroLiquidoEstimado = itemEstoque.preco > 0 ? (valorTotal - custoTotal - impostoEstimado) : 0;
    const idPedido = Date.now();
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const { error: errEst } = await supabaseClient
        .from('estoque')
        .update({ quantidade: itemEstoque.quantidade - qtd })
        .eq('id', itemEstoque.id);
    if (errEst) return alert('Erro ao atualizar estoque: ' + errEst.message);

    const { error: errPed } = await supabaseClient.from('pedidos').insert({
        id: idPedido,
        user_id: usuarioAtual.id,
        cliente,
        doc_cliente: docCliente,
        cep,
        endereco,
        numero_nf: numeroNf,
        produto_nome: itemEstoque.nome,
        unidade: itemEstoque.unidade || 'un',
        ncm: itemEstoque.ncm || '2202.10.00',
        cfop: itemEstoque.cfop || '5102',
        lote_id: itemEstoque.id,
        quantidade: qtd,
        valor_total: valorTotal,
        imposto_estimado: impostoEstimado,
        lucro_liquido_estimado: lucroLiquidoEstimado,
        frota,
        pagamento,
        status: 'Separando',
        hora
    });
    if (errPed) return alert('Erro ao lançar pedido: ' + errPed.message);

    if (pagamento === 'Fiado / Nota') {
        await supabaseClient.from('fiados').insert({
            id: idPedido + 1,
            user_id: usuarioAtual.id,
            pedido_id: idPedido,
            cliente,
            descricao: `${qtd} ${itemEstoque.unidade || 'un'} - ${itemEstoque.nome}`,
            valor: valorTotal,
            data: new Date().toLocaleDateString('pt-BR'),
            pago: false
        });
    }

    this.reset();
    document.getElementById('status-cep').textContent = '';
    await carregarDadosDoBanco();
});

async function avancarStatusPedido(id) {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;
    const proximo = pedido.status === 'Separando' ? 'Em Rota' : (pedido.status === 'Em Rota' ? 'Entregue' : 'Entregue');
    await supabaseClient.from('pedidos').update({ status: proximo }).eq('id', id);
    await carregarDadosDoBanco();
}

async function cancelarPedido(id) {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;
    if (confirm(`Cancelar pedido de "${pedido.cliente}" e devolver ${pedido.quantidade} ao estoque?`)) {
        const itemEstoque = estoque.find(p => p.id === pedido.loteId);
        if (itemEstoque) {
            await supabaseClient.from('estoque').update({ quantidade: itemEstoque.quantidade + pedido.quantidade }).eq('id', itemEstoque.id);
        }
        await supabaseClient.from('fiados').delete().eq('pedido_id', id);
        await supabaseClient.from('pedidos').delete().eq('id', id);
        await carregarDadosDoBanco();
    }
}

async function limparEntregues() {
    const concluidos = pedidos.filter(p => p.status === 'Entregue');
    if (concluidos.length === 0) return alert('Não há pedidos entregues para limpar.');
    if (confirm(`Remover ${concluidos.length} pedido(s) Entregue da lista?`)) {
        await supabaseClient.from('pedidos').delete().eq('status', 'Entregue');
        await carregarDadosDoBanco();
    }
}

function obterPedidosFiltrados() {
    const filtroFrota = document.getElementById('filtro-frota').value;
    if (filtroFrota === 'TODAS') return pedidos;
    return pedidos.filter(p => p.frota === filtroFrota);
}

function copiarRomaneioWhatsApp() {
    const base = obterPedidosFiltrados();
    const ativos = base.filter(p => p.status !== 'Entregue');
    const listaParaCopiar = ativos.length > 0 ? ativos : base;
    if (listaParaCopiar.length === 0) return alert('Não há pedidos para gerar o romaneio.');

    let texto = `🚚 *ROMANEIO DE ENTREGAS* (${new Date().toLocaleDateString('pt-BR')})\n\n`;
    listaParaCopiar.forEach((ped, idx) => {
        const valorFmt = ped.valorTotal > 0 ? ` — ${formatarMoeda(ped.valorTotal)}` : '';
        texto += `*${idx + 1}. ${ped.cliente}* [${ped.status}]\n📍 ${ped.endereco}\n📦 ${ped.quantidade} ${ped.unidade || 'un'} - ${ped.produtoNome}${valorFmt}\n🚛 ${ped.frota} | 💳 ${ped.pagamento}\n\n`;
    });

    navigator.clipboard.writeText(texto.trim()).then(() => alert('Romaneio copiado!')).catch(() => prompt('Copie:', texto.trim()));
}

function imprimirComprovantePedido(id) {
    const ped = pedidos.find(p => p.id === id);
    if (!ped) return;
    const janela = window.open('', '_blank', 'width=460,height=640');
    janela.document.write(`
        <html><body style="font-family:Arial,sans-serif;padding:24px;">
            <h2>📦 GestãoFácil — Comprovante</h2>
            <p><strong>Cliente:</strong> ${ped.cliente} • <strong>NF:</strong> ${ped.numeroNf}</p>
            <p><strong>Endereço:</strong> ${ped.endereco}</p>
            <p><strong>Item:</strong> ${ped.quantidade} ${ped.unidade} — ${ped.produtoNome}</p>
            <p><strong>Frota:</strong> ${ped.frota} • <strong>Pagamento:</strong> ${ped.pagamento}</p>
            <h3>Total: ${formatarMoeda(ped.valorTotal)}</h3>
            <button onclick="window.print()">🖨️ Imprimir</button>
        </body></html>
    `);
    janela.document.close();
}

function renderizarPedidos() {
    const tbody = document.getElementById('tabela-pedidos-corpo');
    const lista = obterPedidosFiltrados();
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding: 24px;">Nenhum pedido encontrado.</td></tr>`;
        return;
    }
    lista.forEach(ped => {
        let badgeStatus = ped.status === 'Separando'
            ? `<span class="badge alerta">📦 Separando</span>`
            : (ped.status === 'Em Rota' ? `<span class="badge rota">🛵 Em Rota</span>` : `<span class="badge ok">✔️ Entregue</span>`);
        let botaoAcao = ped.status === 'Separando'
            ? `<button class="btn-mini acao-rota" onclick="avancarStatusPedido(${ped.id})">🚚 Despachar</button>`
            : (ped.status === 'Em Rota' ? `<button class="btn-mini acao-ok" onclick="avancarStatusPedido(${ped.id})">✅ Entregar</button>` : `<span style="color:#94a3b8;font-size:0.8rem;">Finalizado</span>`);

        const tr = document.createElement('tr');
        if (ped.status === 'Entregue') tr.style.opacity = '0.65';
        tr.innerHTML = `
            <td><strong>${ped.cliente}</strong><br><small style="color:#64748b">📍 ${ped.endereco} • ${ped.hora}</small></td>
            <td><strong>${ped.quantidade} ${ped.unidade}</strong> ${ped.produtoNome}<br><small style="font-weight:600;">${formatarMoeda(ped.valorTotal)}</small></td>
            <td>${ped.frota}</td>
            <td>${ped.pagamento}</td>
            <td>${badgeStatus}</td>
            <td class="acoes-tabela">
                ${botaoAcao}
                <button class="btn-mini" onclick="imprimirComprovantePedido(${ped.id})">🧾</button>
                ${ped.status !== 'Entregue' ? `<button class="btn-mini perigo" onclick="cancelarPedido(${ped.id})">✖</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('form-vasilhame').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!usuarioAtual) return;
    await supabaseClient.from('vasilhames').insert({
        id: Date.now(),
        user_id: usuarioAtual.id,
        cliente: document.getElementById('vas-cliente').value.trim(),
        tipo: document.getElementById('vas-tipo').value,
        qtd_pendente: parseInt(document.getElementById('vas-qtd').value),
        data: new Date().toLocaleDateString('pt-BR')
    });
    this.reset();
    await carregarDadosDoBanco();
});

async function devolverCasco(id) {
    const reg = vasilhames.find(v => v.id === id);
    if (!reg || reg.qtdPendente <= 0) return;
    const novaQtd = reg.qtdPendente - 1;
    if (novaQtd === 0 && confirm(`Todos os cascos de "${reg.cliente}" devolvidos. Arquivar?`)) {
        await supabaseClient.from('vasilhames').delete().eq('id', id);
    } else {
        await supabaseClient.from('vasilhames').update({ qtd_pendente: Math.max(0, novaQtd) }).eq('id', id);
    }
    await carregarDadosDoBanco();
}

async function devolverTodosCascos(id) {
    const reg = vasilhames.find(v => v.id === id);
    if (!reg) return;
    if (confirm(`Confirmar devolução de todos os ${reg.qtdPendente} casco(s) de "${reg.cliente}"?`)) {
        await supabaseClient.from('vasilhames').delete().eq('id', id);
        await carregarDadosDoBanco();
    }
}

async function excluirVasilhame(id) {
    if (confirm('Excluir registro de vasilhame?')) {
        await supabaseClient.from('vasilhames').delete().eq('id', id);
        await carregarDadosDoBanco();
    }
}

function renderizarVasilhames() {
    const tbody = document.getElementById('tabela-vasilhames-corpo');
    const busca = (document.getElementById('busca-vasilhames')?.value || '').toLowerCase();
    tbody.innerHTML = '';
    const filtrados = vasilhames.filter(v => v.cliente.toLowerCase().includes(busca) || v.tipo.toLowerCase().includes(busca));
    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding: 24px;">Nenhum vasilhame encontrado.</td></tr>`;
        return;
    }
    filtrados.forEach(reg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${reg.cliente}</strong><br><small style="color:#64748b">${reg.data}</small></td>
            <td>${reg.tipo}</td>
            <td><strong>${reg.qtdPendente}</strong> un/cx</td>
            <td><span class="badge alerta">Pendente: ${reg.qtdPendente}</span></td>
            <td class="acoes-tabela">
                <button class="btn-mini acao-ok" onclick="devolverCasco(${reg.id})">+1</button>
                ${reg.qtdPendente > 1 ? `<button class="btn-mini" onclick="devolverTodosCascos(${reg.id})">Devolver Tudo</button>` : ''}
                <button class="btn-mini perigo" onclick="excluirVasilhame(${reg.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('form-fiado').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!usuarioAtual) return;
    await supabaseClient.from('fiados').insert({
        id: Date.now(),
        user_id: usuarioAtual.id,
        pedido_id: null,
        cliente: document.getElementById('fia-cliente').value.trim(),
        descricao: document.getElementById('fia-descricao').value.trim(),
        valor: parseFloat(document.getElementById('fia-valor').value) || 0,
        data: new Date().toLocaleDateString('pt-BR'),
        pago: false
    });
    this.reset();
    await carregarDadosDoBanco();
});

async function quitarFiado(id) {
    const registro = fiados.find(f => f.id === id);
    if (!registro) return;
    if (confirm(`Confirmar pagamento de ${formatarMoeda(registro.valor)} de "${registro.cliente}"?`)) {
        await supabaseClient.from('fiados').update({ pago: true }).eq('id', id);
        await carregarDadosDoBanco();
    }
}

async function excluirFiado(id) {
    if (confirm('Excluir lançamento da caderneta?')) {
        await supabaseClient.from('fiados').delete().eq('id', id);
        await carregarDadosDoBanco();
    }
}

function renderizarFiados() {
    const tbody = document.getElementById('tabela-fiados-corpo');
    const filtro = document.getElementById('filtro-fiado')?.value || 'ABERTO';
    tbody.innerHTML = '';
    const filtrados = fiados.filter(f => filtro === 'ABERTO' ? !f.pago : (filtro === 'PAGO' ? f.pago : true));
    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding: 24px;">Nenhuma nota encontrada.</td></tr>`;
        return;
    }
    filtrados.forEach(f => {
        const tr = document.createElement('tr');
        if (f.pago) tr.style.opacity = '0.65';
        tr.innerHTML = `
            <td><strong>${f.cliente}</strong><br><small style="color:#64748b">${f.data}</small></td>
            <td>${f.descricao}</td>
            <td><strong>${formatarMoeda(f.valor)}</strong></td>
            <td>${f.pago ? `<span class="badge ok">✔️ Pago</span>` : `<span class="badge vencido">⏳ Em Aberto</span>`}</td>
            <td class="acoes-tabela">
                ${!f.pago ? `<button class="btn-mini acao-ok" onclick="quitarFiado(${f.id})">💵 Receber</button>` : ''}
                <button class="btn-mini perigo" onclick="excluirFiado(${f.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('form-fornecedor').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!usuarioAtual) return;
    await supabaseClient.from('fornecedores').insert({
        id: Date.now(),
        user_id: usuarioAtual.id,
        nome: document.getElementById('forn-nome').value.trim(),
        ramo: document.getElementById('forn-ramo').value,
        contato: document.getElementById('forn-contato').value.trim() || 'Não informado',
        obs: document.getElementById('forn-obs').value.trim() || '—'
    });
    this.reset();
    await carregarDadosDoBanco();
});

async function excluirFornecedor(id) {
    if (confirm('Remover este fornecedor?')) {
        await supabaseClient.from('fornecedores').delete().eq('id', id);
        await carregarDadosDoBanco();
    }
}

function renderizarFornecedores() {
    const tbody = document.getElementById('tabela-fornecedores-corpo');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (fornecedores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding: 24px;">Nenhum fornecedor cadastrado ainda.</td></tr>`;
        return;
    }
    fornecedores.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${f.nome}</strong><br><small style="color:#64748b">${f.ramo}</small></td>
            <td>${f.contato}</td>
            <td>${f.obs}</td>
            <td class="acoes-tabela"><button class="btn-mini perigo" onclick="excluirFornecedor(${f.id})">🗑️</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarFechamentoCaixa() {
    const jaPago = pedidos.filter(p => p.pagamento === 'Já Pago (PIX)').reduce((s, p) => s + p.valorTotal, 0)
        + fiados.filter(f => f.pago).reduce((s, f) => s + f.valor, 0);
    const cobrarMaquininha = pedidos.filter(p => p.pagamento === 'Cobrar Maquininha').reduce((s, p) => s + p.valorTotal, 0);
    const cobrarDinheiro = pedidos.filter(p => p.pagamento === 'Cobrar Dinheiro').reduce((s, p) => s + p.valorTotal, 0);
    const fiadoEmAberto = fiados.filter(f => !f.pago).reduce((s, f) => s + f.valor, 0);
    const impostoTotalEstimado = pedidos.reduce((s, p) => s + p.impostoEstimado, 0);
    const lucroLiquidoTotal = pedidos.reduce((s, p) => s + p.lucroLiquidoEstimado, 0);

    document.getElementById('caixa-pago').textContent = formatarMoeda(jaPago);
    document.getElementById('caixa-maquininha').textContent = formatarMoeda(cobrarMaquininha);
    document.getElementById('caixa-dinheiro').textContent = formatarMoeda(cobrarDinheiro);
    document.getElementById('caixa-fiado').textContent = formatarMoeda(fiadoEmAberto);
    document.getElementById('caixa-imposto').textContent = formatarMoeda(impostoTotalEstimado);
    document.getElementById('caixa-lucro').textContent = formatarMoeda(lucroLiquidoTotal);
}

function atualizarResumoGeral() {
    const totalItens = estoque.reduce((s, item) => s + item.quantidade, 0);
    const lotesCriticos = estoque.filter(item => calcularDiasParaVencer(item.validade) <= 15).length;
    const entregasPendentes = pedidos.filter(ped => ped.status !== 'Entregue').length;
    const totalCascosPendentes = vasilhames.reduce((s, v) => s + v.qtdPendente, 0);
    const faturamentoTotal = pedidos.reduce((s, ped) => s + ped.valorTotal, 0);
    const aCobrarNaRua = pedidos.filter(ped => ped.status !== 'Entregue' && ped.pagamento.includes('Cobrar')).reduce((s, ped) => s + ped.valorTotal, 0);
    const totalFiadoAberto = fiados.filter(f => !f.pago).reduce((s, f) => s + f.valor, 0);

    document.getElementById('resumo-produtos').textContent = `${totalItens} itens`;
    document.getElementById('resumo-vencendo').textContent = `${lotesCriticos} lotes`;
    document.getElementById('resumo-entregas').textContent = `${entregasPendentes} pedidos`;
    document.getElementById('resumo-faturamento').textContent = formatarMoeda(faturamentoTotal);
    document.getElementById('resumo-cobrar').textContent = `A cobrar em rota: ${formatarMoeda(aCobrarNaRua)}`;
    document.getElementById('resumo-vasilhames').textContent = `${totalCascosPendentes} cascos`;
    document.getElementById('resumo-fiado').textContent = formatarMoeda(totalFiadoAberto);

    renderizarRadarAlertas();
}

function renderizarRadarAlertas() {
    const lista = document.getElementById('lista-alertas-radar');
    lista.innerHTML = '';
    const alertas = [];

    estoque.forEach(item => {
        const dias = calcularDiasParaVencer(item.validade);
        if (dias < 0) alertas.push(`🔴 <strong>VENCIDO:</strong> ${item.nome} (${item.quantidade} ${item.unidade}) venceu há ${Math.abs(dias)}d.`);
        else if (dias <= 15) alertas.push(`🟡 <strong>VENCENDO:</strong> ${item.nome} (${item.quantidade} ${item.unidade}) vence em ${dias}d.`);
        if (item.quantidade <= 5) alertas.push(`🟠 <strong>ESTOQUE BAIXO:</strong> Restam ${item.quantidade} ${item.unidade} de ${item.nome}.`);
    });
    vasilhames.forEach(v => { if (v.qtdPendente > 0) alertas.push(`🟣 <strong>CASCO PENDENTE:</strong> ${v.cliente} está com ${v.qtdPendente}x ${v.tipo}.`); });
    fiados.forEach(f => { if (!f.pago) alertas.push(`📒 <strong>NOTA EM ABERTO:</strong> ${f.cliente} deve ${formatarMoeda(f.valor)} (${f.descricao}).`); });

    lista.innerHTML = alertas.length === 0
        ? `<li class="alerta-ok">✅ Tudo sob controle no momento!</li>`
        : alertas.map(t => `<li>${t}</li>`).join('');
}

function exportarBackup() {
    const dados = { dataExportacao: new Date().toISOString(), estoque, pedidos, vasilhames, fiados, fornecedores, catalogoPersonalizado };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-gestaofacil-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('form-auth').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const senha = document.getElementById('auth-senha').value;
    const msg = document.getElementById('auth-mensagem');
    msg.textContent = 'Entrando...';

    const res = await fazerLogin(email, senha);
    msg.textContent = res.ok ? '' : res.mensagem;
});

document.getElementById('btn-cadastrar').addEventListener('click', async function() {
    const email = document.getElementById('auth-email').value;
    const senha = document.getElementById('auth-senha').value;
    const msg = document.getElementById('auth-mensagem');
    if (!email || senha.length < 6) {
        msg.textContent = 'Preencha um e-mail válido e senha de pelo menos 6 caracteres.';
        return;
    }
    msg.textContent = 'Criando conta...';
    const res = await criarConta(email, senha);
    msg.textContent = res.mensagem || '';
});

verificarSessaoInicial();
