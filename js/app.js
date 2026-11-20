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