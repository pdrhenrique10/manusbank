// server.js - Backend ManusBank (ESM)

import express from "express";
import cors from "cors";

import {
  criarConta,
  fazerLogin,
  estaLogado,
  obterUsuarioLogado,
  obterSaldo,
  obterTransacoes,
  fazerLogout,
  adicionarTransacao,
  removerTransacao,
} from "./auth.js";

console.log("Iniciando server.js..."); 

const app = express();

// ===== CONTAS A RECEBER EM MEMÓRIA =====
let contasReceber = [];
let nextContaReceberId = 1;

// ===== CONTAS A PAGAR EM MEMÓRIA =====
let contasPagar = [];
let nextContaPagarId = 1;

// ===== METAS EM MEMÓRIA =====
let metas = [];
let nextMetaId = 1;

// permite JSON no body
app.use(express.json());

// permite o frontend (React) acessar esse backend
app.use(
  cors({
    origin: "*", // se quiser, depois limita para o endereço do seu front
  })
);

// ROTA: criar conta (registro)
app.post("/api/registro", (req, res) => {
  const { nome, email, senha } = req.body;

  const resultado = criarConta(nome, email, senha);

  if (!resultado.sucesso) {
    return res.status(400).json(resultado);
  }

  return res.json(resultado);
});

// ROTA: login
app.post("/api/login", (req, res) => {
  const { email, senha } = req.body;

  const resultado = fazerLogin(email, senha);

  if (!resultado.sucesso) {
    return res.status(400).json(resultado);
  }

  return res.json(resultado);
});

// ROTA: dashboard (dados do usuário logado)
app.get("/api/dashboard", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const usuario = obterUsuarioLogado();
  const saldo = obterSaldo();
  const transacoes = obterTransacoes();

  return res.json({ usuario, saldo, transacoes });
});

// ROTA: relatórios financeiros
app.get("/api/relatorios", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const saldo = obterSaldo();
  const transacoes = obterTransacoes() || [];

  // Define receitas e despesas pelos tipos
  const tiposReceita = ["deposito", "transferenciaEntrada"];
  const tiposDespesa = ["saque", "transferenciaSaida"];

  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  let totalReceitas = 0;
  let totalDespesas = 0;

  let totalReceitasMes = 0;
  let totalDespesasMes = 0;

  const despesasPorCategoria = {};

  transacoes.forEach((t) => {
    const valor = Number(t.valor) || 0;
    const data = t.data ? new Date(t.data) : null;
    const ehMesAtual =
      data && data.getMonth() === mesAtual && data.getFullYear() === anoAtual;

    if (tiposReceita.includes(t.tipo)) {
      totalReceitas += valor;
      if (ehMesAtual) {
        totalReceitasMes += valor;
      }
    } else if (tiposDespesa.includes(t.tipo)) {
      totalDespesas += valor;
      if (ehMesAtual) {
        totalDespesasMes += valor;
      }

      // Categoria básica: usa descricao como "categoria" simples
      const categoria = t.categoria || t.descricao || "Outros";
      if (!despesasPorCategoria[categoria]) {
        despesasPorCategoria[categoria] = 0;
      }
      despesasPorCategoria[categoria] += valor;
    }
  });

  const categoriasArray = Object.entries(despesasPorCategoria).map(
    ([nome, valor]) => ({
      nome,
      valor,
    })
  );

  return res.json({
    saldoAtual: saldo,
    totalReceitas,
    totalDespesas,
    receitasDespesasMes: {
      receitas: totalReceitasMes,
      despesas: totalDespesasMes,
    },
    despesasPorCategoria: categoriasArray,
  });
});

// ROTA: criar transação (receita / despesa / transferência)
app.post("/api/transacao", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  // CORRIGIDO: Extrai a data do body também
  const { tipo, valor, descricao, data, categoria } = req.body;

  // Se a data for enviada, usa ela; caso contrário, usa a data atual
  const dataTransacao = data || new Date().toISOString().slice(0, 10);

  const resultado = adicionarTransacao(
    tipo, // "deposito", "saque", "transferenciaEntrada", "transferenciaSaida"
    Number(valor),
    descricao || "",
    dataTransacao, // Passa a data
    categoria // Passa a categoria
  );

  if (!resultado.sucesso) {
    return res.status(400).json(resultado);
  }

  return res.json(resultado);
});

// NOVO: ROTA para remover transação
app.delete("/api/transacao/:id", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const id = Number(req.params.id);
  const resultado = removerTransacao(id);

  if (!resultado.sucesso) {
    return res.status(400).json(resultado);
  }

  return res.json(resultado);
});

// ===== ROTAS: CONTAS A RECEBER =====

// GET /api/contas-receber - lista todas as contas a receber
app.get("/api/contas-receber", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  return res.json(contasReceber);
});

// POST /api/contas-receber - cria uma conta a receber (pendente)
app.post("/api/contas-receber", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const { cliente, valor, vencimento, descricao } = req.body;

  if (!cliente || !valor || !vencimento) {
    return res
      .status(400)
      .json({ erro: "Campos obrigatórios: cliente, valor, vencimento" });
  }

  const nova = {
    id: nextContaReceberId++,
    cliente,
    valor: Number(valor),
    // salva a data exatamente como veio do input type="date" (YYYY-MM-DD)
    vencimento: String(vencimento).slice(0, 10),
    descricao: descricao || "",
    status: "pendente",
    dataRecebimento: null,
    dataUltimaCobranca: null,
  };

  contasReceber.push(nova);

  return res.status(201).json(nova);
});

// PATCH /api/contas-receber/:id/pagar - marca conta como paga e cria transação de deposito
app.patch("/api/contas-receber/:id/pagar", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const id = Number(req.params.id);
  const { dataRecebimento } = req.body; // CORRIGIDO: Pega a data de recebimento do body
  const conta = contasReceber.find((c) => c.id === id);

  if (!conta) {
    return res.status(404).json({ erro: "Conta não encontrada" });
  }

  if (conta.status === "pago") {
    return res.status(400).json({ erro: "Conta já está marcada como paga" });
  }

  conta.status = "pago";
  // CORRIGIDO: Usa a data enviada ou a data atual
  conta.dataRecebimento = dataRecebimento || new Date().toISOString().slice(0, 10);

  // registra receita no sistema existente
  // CORRIGIDO: Passa a data de recebimento para a transação
  const dataTransacao = dataRecebimento || new Date().toISOString().slice(0, 10);
  const resultado = adicionarTransacao(
    "deposito",
    conta.valor,
    conta.descricao || `Recebimento de ${conta.cliente}`,
    dataTransacao,
    "Recebimento"
  );

  if (!resultado.sucesso) {
    return res.status(400).json(resultado);
  }

  return res.json({ conta, transacao: resultado.transacao || null });
});

// PATCH /api/contas-receber/:id/cobrar - registra tentativa de cobrança
app.patch("/api/contas-receber/:id/cobrar", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const id = Number(req.params.id);
  const conta = contasReceber.find((c) => c.id === id);

  if (!conta) {
    return res.status(404).json({ erro: "Conta não encontrada" });
  }

  conta.dataUltimaCobranca = new Date().toISOString().slice(0, 10);

  return res.json(conta);
});

// NOVO: DELETE /api/contas-receber/:id
app.delete("/api/contas-receber/:id", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const id = Number(req.params.id);
  const index = contasReceber.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ erro: "Conta não encontrada" });
  }

  const removida = contasReceber.splice(index, 1)[0];

  return res.json({ sucesso: true, removida });
});

// ===== ROTAS: CONTAS A PAGAR =====

// GET /api/contas-pagar - lista todas as contas a pagar
app.get("/api/contas-pagar", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  return res.json(contasPagar);
});

// POST /api/contas-pagar - cria uma conta a pagar (pendente)
app.post("/api/contas-pagar", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const { titulo, tipo, valor, vencimento, descricao } = req.body;

  if (!titulo || !valor || !vencimento) {
    return res.status(400).json({
      erro: "Campos obrigatórios: titulo, valor, vencimento",
    });
  }

  const nova = {
    id: nextContaPagarId++,
    titulo,
    tipo: tipo || "geral",
    valor: Number(valor),
    // mesma ideia: guarda só "YYYY-MM-DD"
    vencimento: String(vencimento).slice(0, 10),
    descricao: descricao || "",
    status: "pendente",
    dataPagamento: null,
    dataCriacao: new Date().toISOString().slice(0, 10), // CORRIGIDO: Guarda só a data
  };

  contasPagar.push(nova);

  return res.status(201).json(nova);
});

// PATCH /api/contas-pagar/:id/pagar - marca conta como paga e cria DESPESA
app.patch("/api/contas-pagar/:id/pagar", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const id = Number(req.params.id);
  const { dataPagamento } = req.body; // CORRIGIDO: Pega a data de pagamento do body
  const conta = contasPagar.find((c) => c.id === id);

  if (!conta) {
    return res.status(404).json({ erro: "Conta não encontrada" });
  }

  if (conta.status === "pago") {
    return res.status(400).json({ erro: "Conta já está marcada como paga" });
  }

  conta.status = "pago";
  // CORRIGIDO: Usa a data enviada ou a data atual
  conta.dataPagamento = dataPagamento || new Date().toISOString().slice(0, 10);

  // registra despesa no sistema de transações
  // CORRIGIDO: Passa a data de pagamento para a transação
  const dataTransacao = dataPagamento || new Date().toISOString().slice(0, 10);
  const resultado = adicionarTransacao(
    "saque", // saída de dinheiro
    conta.valor,
    conta.descricao || `Pagamento: ${conta.titulo}`,
    dataTransacao,
    "Pagamento"
  );

  if (!resultado.sucesso) {
    return res.status(400).json(resultado);
  }

  return res.json({ conta, transacao: resultado.transacao || null });
});

// NOVO: DELETE /api/contas-pagar/:id
app.delete("/api/contas-pagar/:id", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const id = Number(req.params.id);
  const index = contasPagar.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ erro: "Conta não encontrada" });
  }

  const removida = contasPagar.splice(index, 1)[0];

  return res.json({ sucesso: true, removida });
});

// ===== ROTAS: METAS =====

// GET /api/metas - lista metas
app.get("/api/metas", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  return res.json(metas);
});

// POST /api/metas - cria meta
app.post("/api/metas", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const { titulo, valorAlvo, dataMeta, descricao } = req.body;

  if (!titulo || !valorAlvo || !dataMeta) {
    return res.status(400).json({
      erro: "Campos obrigatórios: titulo, valorAlvo, dataMeta",
    });
  }

  const novaMeta = {
    id: nextMetaId++,
    titulo,
    valorAlvo: Number(valorAlvo),
    valorAtual: 0,
    // aqui também guardamos só a data (YYYY-MM-DD)
    dataMeta: String(dataMeta).slice(0, 10),
    descricao: descricao || "",
    dataCriacao: new Date().toISOString().slice(0, 10), // CORRIGIDO: Guarda só a data
  };

  metas.push(novaMeta);

  return res.status(201).json(novaMeta);
});

// PATCH /api/metas/:id/aportar - adiciona dinheiro à meta
app.patch("/api/metas/:id/aportar", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const id = Number(req.params.id);
  const { valor, descricao, dataAporte } = req.body; // CORRIGIDO: Pega a data do body

  if (!valor) {
    return res.status(400).json({ erro: "Campo obrigatório: valor" });
  }

  const meta = metas.find((m) => m.id === id);

  if (!meta) {
    return res.status(404).json({ erro: "Meta não encontrada" });
  }

  const aporte = Number(valor);
  if (aporte <= 0) {
    return res
      .status(400)
      .json({ erro: "O valor do aporte deve ser maior que zero" });
  }

  meta.valorAtual += aporte;

  // registra como saque (saída) no extrato
  const dataTransacao = dataAporte || new Date().toISOString().slice(0, 10);
  const resultado = adicionarTransacao(
    "saque",
    aporte,
    descricao || `Aporte na meta: ${meta.titulo}`,
    dataTransacao,
    "Aporte Meta"
  );

  if (!resultado.sucesso) {
    return res.status(400).json(resultado);
  }

  return res.json({ meta, transacao: resultado.transacao || null });
});

// NOVO: PATCH /api/metas/:id/desaportar - tira dinheiro da meta
app.patch("/api/metas/:id/desaportar", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const id = Number(req.params.id);
  const { valor, descricao, dataDesaporte } = req.body; // CORRIGIDO: Pega a data do body

  if (!valor) {
    return res.status(400).json({ erro: "Campo obrigatório: valor" });
  }

  const meta = metas.find((m) => m.id === id);

  if (!meta) {
    return res.status(404).json({ erro: "Meta não encontrada" });
  }

  const retirada = Number(valor);
  if (retirada <= 0) {
    return res
      .status(400)
      .json({ erro: "O valor a retirar deve ser maior que zero" });
  }

  // garante que não fica negativo
  const valorAtualNumero = Number(meta.valorAtual) || 0;
  const novoValor = Math.max(0, valorAtualNumero - retirada);
  meta.valorAtual = novoValor;

  // registra como deposito (entrada) no extrato
  const dataTransacao = dataDesaporte || new Date().toISOString().slice(0, 10);
  const resultado = adicionarTransacao(
    "deposito",
    retirada,
    descricao || `Retirada da meta: ${meta.titulo}`,
    dataTransacao,
    "Retirada Meta"
  );

  if (!resultado.sucesso) {
    return res.status(400).json(resultado);
  }

  return res.json({ meta, transacao: resultado.transacao || null });
});

// DELETE /api/metas/:id - remove meta
app.delete("/api/metas/:id", (req, res) => {
  if (!estaLogado()) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  const id = Number(req.params.id);
  const index = metas.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ erro: "Meta não encontrada" });
  }

  const removida = metas.splice(index, 1)[0];

  return res.json({ sucesso: true, removida });
});

// ROTA: logout
app.post("/api/logout", (req, res) => {
  fazerLogout();
  res.json({ sucesso: true });
});

console.log("Preparando para escutar na porta 3000...");

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ManusBank rodando na porta ${PORT}`);
});