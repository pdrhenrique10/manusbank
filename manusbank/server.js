// server.js - ManusFinance (JSON local)

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USUARIOS_FILE = path.join(__dirname, "usuarios.json");
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "troque-esta-chave-em-producao";

// Garante que o arquivo existe
if (!fs.existsSync(USUARIOS_FILE)) {
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify([], null, 2));
}

const app = express();

// ===== CORS BÁSICO =====
// Se quiser travar só pro front da apresentação depois, troca "*" pela URL do front.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// ===== FUNÇÕES AUXILIARES =====
function criptografarSenha(senha) {
  return crypto.createHash("sha256").update(senha).digest("hex");
}

function carregarUsuarios() {
  try {
    const data = fs.readFileSync(USUARIOS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function salvarUsuarios(usuarios) {
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2));
}

function dataHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// ===== LÓGICA DE PERÍODO =====
function calcularJanela(periodo) {
  const hoje = dataHoje();
  const [ano, mes] = hoje.split("-").map(Number);
  let dataInicio;

  if (periodo === "3m") {
    const d = new Date(ano, mes - 1, 1);
    d.setMonth(d.getMonth() - 2);
    dataInicio = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-01`;
  } else if (periodo === "6m") {
    const d = new Date(ano, mes - 1, 1);
    d.setMonth(d.getMonth() - 5);
    dataInicio = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-01`;
  } else if (periodo === "ano") {
    dataInicio = `${ano}-01-01`;
  } else {
    dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  }

  return { dataInicio, dataFim: hoje };
}

function dentroDoPeriodo(dataStr, dataInicio, dataFim) {
  return dataStr >= dataInicio && dataStr <= dataFim;
}

// ===== JWT =====
function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nome: usuario.nome },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const usuarios = carregarUsuarios();
    const usuario = usuarios.find((u) => u.id === payload.id);

    if (!usuario) {
      return res
        .status(401)
        .json({ erro: "Usuário não encontrado. Faça login novamente." });
    }

    req.usuario = usuario;
    req.usuarioEmail = usuario.email;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

// ===== ROTAS PÚBLICAS =====
app.post("/api/register", (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const usuarios = carregarUsuarios();

  if (usuarios.find((u) => u.email === email)) {
    return res.status(400).json({ erro: "Este email já está cadastrado" });
  }

  const novoUsuario = {
    id: Date.now(),
    nome,
    email,
    senha: criptografarSenha(senha),
    saldo: 0,
    transacoes: [],
    contasReceber: [],
    nextContaReceberId: 1,
    contasPagar: [],
    nextContaPagarId: 1,
    metas: [],
    nextMetaId: 1,
    criadoEm: new Date().toISOString(),
  };

  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);

  const token = gerarToken(novoUsuario);

  res.status(201).json({
    sucesso: true,
    token,
    user: { id: novoUsuario.id, nome, email },
  });
});

app.post("/api/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Preencha email e senha" });
  }

  const usuarios = carregarUsuarios();
  const usuario = usuarios.find((u) => u.email === email);

  if (!usuario) {
    return res
      .status(401)
      .json({ erro: "Conta não encontrada. Faça o registro primeiro." });
  }

  if (usuario.senha !== criptografarSenha(senha)) {
    return res.status(401).json({ erro: "Senha incorreta. Tente novamente." });
  }

  const token = gerarToken(usuario);

  res.json({
    sucesso: true,
    token,
    user: { id: usuario.id, nome: usuario.nome, email },
  });
});

app.post("/api/logout", (req, res) => {
  res.json({ sucesso: true });
});

// ===== ROTAS PROTEGIDAS =====
app.get("/api/dashboard", autenticar, (req, res) => {
  res.json({
    usuario: { nome: req.usuario.nome, email: req.usuario.email },
    saldo: req.usuario.saldo || 0,
    transacoes: req.usuario.transacoes || [],
  });
});

app.get("/api/relatorios", autenticar, (req, res) => {
  const transacoes = req.usuario.transacoes || [];
  const saldo = req.usuario.saldo || 0;
  const periodosValidos = ["mes", "3m", "6m", "ano"];
  const periodo = periodosValidos.includes(req.query.periodo)
    ? req.query.periodo
    : "mes";
  const { dataInicio, dataFim } = calcularJanela(periodo);
  const tiposReceita = ["deposito", "transferenciaEntrada"];
  const tiposDespesa = ["saque", "transferenciaSaida"];

  let totalReceitas = 0;
  let totalDespesas = 0;
  const despesasPorCategoria = {};
  const receitasPorCategoria = {};
  const evolucaoPorMes = {};

  const transacoesFiltradas = transacoes.filter(
    (t) => t.data && dentroDoPeriodo(t.data, dataInicio, dataFim)
  );

  transacoesFiltradas.forEach((t) => {
    const valor = Number(t.valor) || 0;
    const [ano, mes] = t.data.split("-").map(Number);
    const mesKey = `${ano}-${String(mes).padStart(2, "0")}`;

    if (!evolucaoPorMes[mesKey]) {
      evolucaoPorMes[mesKey] = { nome: mesKey, receitas: 0, despesas: 0 };
    }

    if (tiposReceita.includes(t.tipo)) {
      totalReceitas += valor;
      evolucaoPorMes[mesKey].receitas += valor;
      const categoria = t.categoria || t.descricao || "Receitas";
      receitasPorCategoria[categoria] =
        (receitasPorCategoria[categoria] || 0) + valor;
    }

    if (tiposDespesa.includes(t.tipo)) {
      totalDespesas += valor;
      evolucaoPorMes[mesKey].despesas += valor;
      const categoria = t.categoria || t.descricao || "Outros";
      despesasPorCategoria[categoria] =
        (despesasPorCategoria[categoria] || 0) + valor;
    }
  });

  const gastosPorCategoria = Object.entries(despesasPorCategoria)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  const entradasPorCategoria = Object.entries(receitasPorCategoria)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  const evolucaoMensal = Object.values(evolucaoPorMes).sort((a, b) =>
    a.nome.localeCompare(b.nome)
  );

  const temDados = transacoesFiltradas.length > 0;
  const labelsPeriodo = {
    mes: "este mês",
    "3m": "nos últimos 3 meses",
    "6m": "nos últimos 6 meses",
    ano: "este ano",
  };
  const mensagem = temDados
    ? null
    : `Você ainda não registrou nenhuma transação ${labelsPeriodo[periodo]}.`;

  const sobra = totalReceitas - totalDespesas;
  const taxaEconomia =
    totalReceitas > 0 ? (sobra / totalReceitas) * 100 : 0;

  res.json({
    periodo,
    saldoAtual: saldo,
    totalEntradas: totalReceitas,
    totalGastos: totalDespesas,
    totalReceitas,
    totalDespesas,
    sobra,
    taxaEconomia: Math.round(taxaEconomia),
    gastosPorCategoria,
    entradasPorCategoria,
    despesasPorCategoria: gastosPorCategoria,
    evolucaoMensal,
    temDados,
    mensagem,
    comparativoMensal: evolucaoMensal.map((m) => ({
      mes: m.nome,
      entradas: m.receitas,
      gastos: m.despesas,
    })),
  });
});

app.get("/api/relatorios/grafico", autenticar, (req, res) => {
  const transacoes = req.usuario.transacoes || [];
  const periodo = req.query.periodo || "mes";
  const { dataInicio, dataFim } = calcularJanela(periodo);
  const tiposReceita = ["deposito", "transferenciaEntrada"];
  const tiposDespesa = ["saque", "transferenciaSaida"];
  const dadosPorMes = {};

  transacoes.forEach((t) => {
    if (!t.data || t.data < dataInicio || t.data > dataFim) return;

    const [ano, mes] = t.data.split("-");
    const chave = `${ano}-${mes}`;
    const nomeMes = new Date(ano, parseInt(mes) - 1).toLocaleString(
      "pt-BR",
      { month: "short" }
    );

    if (!dadosPorMes[chave]) {
      dadosPorMes[chave] = { mes: nomeMes, entradas: 0, gastos: 0 };
    }

    const valor = Number(t.valor) || 0;
    if (tiposReceita.includes(t.tipo)) {
      dadosPorMes[chave].entradas += valor;
    } else if (tiposDespesa.includes(t.tipo)) {
      dadosPorMes[chave].gastos += valor;
    }
  });

  const comparativoMensal = Object.keys(dadosPorMes)
    .sort()
    .map((key) => dadosPorMes[key]);

  const gastosPorCategoria = {};
  transacoes.forEach((t) => {
    if (!t.data || t.data < dataInicio || t.data > dataFim) return;
    if (!tiposDespesa.includes(t.tipo)) return;

    const categoria = t.categoria || t.descricao || "Outros";
    const valor = Number(t.valor) || 0;
    gastosPorCategoria[categoria] =
      (gastosPorCategoria[categoria] || 0) + valor;
  });

  const categorias = Object.entries(gastosPorCategoria)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  res.json({
    comparativoMensal,
    gastosPorCategoria: categorias,
    totalEntradas: comparativoMensal.reduce(
      (sum, m) => sum + m.entradas,
      0
    ),
    totalGastos: comparativoMensal.reduce((sum, m) => sum + m.gastos, 0),
  });
});

// ===== TRANSAÇÕES =====
app.post("/api/transacao", autenticar, (req, res) => {
  const { tipo, valor, descricao, data, categoria } = req.body;
  const numeroValor = Number(valor);

  if (!tipo || !Number.isFinite(numeroValor) || numeroValor <= 0) {
    return res
      .status(400)
      .json({ erro: "Tipo e valor válidos são obrigatórios" });
  }

  const dataTransacao = data || dataHoje();
  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  if (index === -1) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const novaTransacao = {
    id: Date.now(),
    tipo,
    valor: numeroValor,
    descricao: descricao || "",
    data: dataTransacao,
    categoria: categoria || descricao || "Geral",
  };

  usuarios[index].transacoes = usuarios[index].transacoes || [];
  usuarios[index].transacoes.push(novaTransacao);

  if (tipo === "deposito" || tipo === "transferenciaEntrada") {
    usuarios[index].saldo = (usuarios[index].saldo || 0) + numeroValor;
  } else {
    usuarios[index].saldo = (usuarios[index].saldo || 0) - numeroValor;
  }

  salvarUsuarios(usuarios);

  res.json({
    sucesso: true,
    transacao: novaTransacao,
    saldo: usuarios[index].saldo,
  });
});

function impactoNoSaldo(tipo, valor) {
  const numeroValor = Number(valor) || 0;
  if (tipo === "deposito" || tipo === "transferenciaEntrada") {
    return numeroValor;
  }
  if (tipo === "saque" || tipo === "transferenciaSaida") {
    return -numeroValor;
  }
  return 0;
}

app.put("/api/transacao/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const { tipo, valor, descricao, data, categoria } = req.body;
  const numeroValor = Number(valor);

  if (!tipo || !Number.isFinite(numeroValor) || numeroValor <= 0) {
    return res
      .status(400)
      .json({ erro: "Tipo e valor válidos são obrigatórios" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  if (index === -1) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const transacoes = usuarios[index].transacoes || [];
  const transacaoIndex = transacoes.findIndex((t) => t.id === id);

  if (transacaoIndex === -1) {
    return res.status(404).json({ erro: "Transação não encontrada" });
  }

  const antiga = transacoes[transacaoIndex];
  const impactoAntigo = impactoNoSaldo(antiga.tipo, antiga.valor);
  const impactoNovo = impactoNoSaldo(tipo, numeroValor);

  const atualizada = {
    ...antiga,
    tipo,
    valor: numeroValor,
    descricao: descricao ?? antiga.descricao ?? "",
    data: data || antiga.data || dataHoje(),
    categoria: categoria || descricao || antiga.categoria || "Geral",
  };

  transacoes[transacaoIndex] = atualizada;
  usuarios[index].transacoes = transacoes;
  usuarios[index].saldo =
    (usuarios[index].saldo || 0) - impactoAntigo + impactoNovo;

  salvarUsuarios(usuarios);

  res.json({
    sucesso: true,
    transacao: atualizada,
    saldo: usuarios[index].saldo,
  });
});

app.delete("/api/transacao/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  if (index === -1) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const transacoes = usuarios[index].transacoes || [];
  const transacaoIndex = transacoes.findIndex((t) => t.id === id);

  if (transacaoIndex === -1) {
    return res.status(404).json({ erro: "Transação não encontrada" });
  }

  const removida = transacoes.splice(transacaoIndex, 1)[0];

  if (
    removida.tipo === "deposito" ||
    removida.tipo === "transferenciaEntrada"
  ) {
    usuarios[index].saldo -= removida.valor;
  } else {
    usuarios[index].saldo += removida.valor;
  }

  usuarios[index].transacoes = transacoes;
  salvarUsuarios(usuarios);

  res.json({ sucesso: true, removida, saldo: usuarios[index].saldo });
});

// ===== CONTAS A RECEBER =====
app.get("/api/contas-receber", autenticar, (req, res) => {
  res.json(req.usuario.contasReceber || []);
});

app.post("/api/contas-receber", autenticar, (req, res) => {
  const { cliente, valor, vencimento, descricao } = req.body;
  if (!cliente || !valor || !vencimento) {
    return res
      .status(400)
      .json({ erro: "Cliente, valor e vencimento são obrigatórios" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const nova = {
    id: req.usuario.nextContaReceberId ?? 1,
    cliente,
    valor: Number(valor),
    vencimento: String(vencimento).slice(0, 10),
    descricao: descricao || "",
    status: "pendente",
    dataRecebimento: null,
    dataUltimaCobranca: null,
  };

  usuarios[index].contasReceber = usuarios[index].contasReceber || [];
  usuarios[index].contasReceber.push(nova);
  usuarios[index].nextContaReceberId =
    (usuarios[index].nextContaReceberId ?? 1) + 1;

  salvarUsuarios(usuarios);
  res.status(201).json(nova);
});

app.put("/api/contas-receber/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const { cliente, valor, vencimento, descricao } = req.body;

  if (!cliente || !valor || !vencimento) {
    return res
      .status(400)
      .json({ erro: "Cliente, valor e vencimento são obrigatórios" });
  }

  const numeroValor = Number(valor);
  if (!Number.isFinite(numeroValor) || numeroValor <= 0) {
    return res.status(400).json({ erro: "Valor inválido" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  if (index === -1) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const contas = usuarios[index].contasReceber || [];
  const contaIndex = contas.findIndex((c) => c.id === id);

  if (contaIndex === -1) {
    return res.status(404).json({ erro: "Conta não encontrada" });
  }

  const conta = contas[contaIndex];
  if (conta.status === "pago") {
    return res
      .status(400)
      .json({ erro: "Não é possível editar um ganho já recebido" });
  }

  const atualizada = {
    ...conta,
    cliente,
    valor: numeroValor,
    vencimento: String(vencimento).slice(0, 10),
    descricao: descricao ?? conta.descricao ?? "",
  };

  contas[contaIndex] = atualizada;
  usuarios[index].contasReceber = contas;
  salvarUsuarios(usuarios);

  res.json({ sucesso: true, conta: atualizada });
});

app.patch("/api/contas-receber/:id/pagar", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const contas = usuarios[index].contasReceber || [];
  const conta = contas.find((c) => c.id === id);

  if (!conta) return res.status(404).json({ erro: "Conta não encontrada" });
  if (conta.status === "pago")
    return res.status(400).json({ erro: "Conta já está paga" });

  conta.status = "pago";
  conta.dataRecebimento = dataHoje();

  const novaTransacao = {
    id: Date.now(),
    tipo: "deposito",
    valor: conta.valor,
    descricao: `Recebimento: ${conta.cliente}`,
    data: conta.dataRecebimento,
    categoria: "Contas a Receber",
  };

  usuarios[index].transacoes = usuarios[index].transacoes || [];
  usuarios[index].transacoes.push(novaTransacao);
  usuarios[index].saldo = (usuarios[index].saldo || 0) + conta.valor;

  salvarUsuarios(usuarios);
  res.json({ conta, transacao: novaTransacao, saldo: usuarios[index].saldo });
});

app.delete("/api/contas-receber/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  usuarios[index].contasReceber =
    usuarios[index].contasReceber?.filter((c) => c.id !== id) || [];
  salvarUsuarios(usuarios);
  res.json({ sucesso: true });
});

// ===== CONTAS A PAGAR =====
app.get("/api/contas-pagar", autenticar, (req, res) => {
  res.json(req.usuario.contasPagar || []);
});

app.post("/api/contas-pagar", autenticar, (req, res) => {
  const { titulo, tipo, valor, vencimento, descricao } = req.body;
  if (!titulo || !valor || !vencimento) {
    return res
      .status(400)
      .json({ erro: "Título, valor e vencimento são obrigatórios" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const nova = {
    id: req.usuario.nextContaPagarId ?? 1,
    titulo,
    tipo: tipo || "geral",
    valor: Number(valor),
    vencimento: String(vencimento).slice(0, 10),
    descricao: descricao || "",
    status: "pendente",
    dataPagamento: null,
    dataCriacao: dataHoje(),
  };

  usuarios[index].contasPagar = usuarios[index].contasPagar || [];
  usuarios[index].contasPagar.push(nova);
  usuarios[index].nextContaPagarId =
    (usuarios[index].nextContaPagarId ?? 1) + 1;

  salvarUsuarios(usuarios);
  res.status(201).json(nova);
});

app.put("/api/contas-pagar/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const { titulo, tipo, valor, vencimento, descricao } = req.body;

  if (!titulo || !valor || !vencimento) {
    return res
      .status(400)
      .json({ erro: "Título, valor e vencimento são obrigatórios" });
  }

  const numeroValor = Number(valor);
  if (!Number.isFinite(numeroValor) || numeroValor <= 0) {
    return res.status(400).json({ erro: "Valor inválido" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  if (index === -1) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const contas = usuarios[index].contasPagar || [];
  const contaIndex = contas.findIndex((c) => c.id === id);

  if (contaIndex === -1) {
    return res.status(404).json({ erro: "Conta não encontrada" });
  }

  const conta = contas[contaIndex];
  if (conta.status === "pago") {
    return res
      .status(400)
      .json({ erro: "Não é possível editar um gasto já pago" });
  }

  const atualizada = {
    ...conta,
    titulo,
    tipo: tipo || conta.tipo || "geral",
    valor: numeroValor,
    vencimento: String(vencimento).slice(0, 10),
    descricao: descricao ?? conta.descricao ?? "",
  };

  contas[contaIndex] = atualizada;
  usuarios[index].contasPagar = contas;
  salvarUsuarios(usuarios);

  res.json({ sucesso: true, conta: atualizada });
});

app.patch("/api/contas-pagar/:id/pagar", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const contas = usuarios[index].contasPagar || [];
  const conta = contas.find((c) => c.id === id);

  if (!conta) return res.status(404).json({ erro: "Conta não encontrada" });
  if (conta.status === "pago")
    return res.status(400).json({ erro: "Conta já está paga" });

  conta.status = "pago";
  conta.dataPagamento = dataHoje();

  const novaTransacao = {
    id: Date.now(),
    tipo: "saque",
    valor: conta.valor,
    descricao: `Pagamento: ${conta.titulo}`,
    data: conta.dataPagamento,
    categoria: conta.tipo || "Contas a Pagar",
  };

  usuarios[index].transacoes = usuarios[index].transacoes || [];
  usuarios[index].transacoes.push(novaTransacao);
  usuarios[index].saldo = (usuarios[index].saldo || 0) - conta.valor;

  salvarUsuarios(usuarios);
  res.json({ conta, transacao: novaTransacao, saldo: usuarios[index].saldo });
});

app.delete("/api/contas-pagar/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  usuarios[index].contasPagar =
    usuarios[index].contasPagar?.filter((c) => c.id !== id) || [];
  salvarUsuarios(usuarios);
  res.json({ sucesso: true });
});

// ===== METAS =====
app.get("/api/metas", autenticar, (req, res) => {
  res.json(req.usuario.metas || []);
});

app.post("/api/metas", autenticar, (req, res) => {
  const { titulo, valorAlvo, dataMeta, descricao } = req.body;
  if (!titulo || !valorAlvo || !dataMeta) {
    return res.status(400).json({
      erro: "Título, valor alvo e data são obrigatórios",
    });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const novaMeta = {
    id: req.usuario.nextMetaId ?? 1,
    titulo,
    valorAlvo: Number(valorAlvo),
    valorAtual: 0,
    dataMeta: String(dataMeta).slice(0, 10),
    descricao: descricao || "",
    dataCriacao: dataHoje(),
  };

  usuarios[index].metas = usuarios[index].metas || [];
  usuarios[index].metas.push(novaMeta);
  usuarios[index].nextMetaId =
    (usuarios[index].nextMetaId ?? 1) + 1;

  salvarUsuarios(usuarios);
  res.status(201).json(novaMeta);
});

app.put("/api/metas/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const { titulo, valorAlvo, dataMeta, descricao } = req.body;

  if (!titulo || !valorAlvo || !dataMeta) {
    return res.status(400).json({
      erro: "Título, valor alvo e data são obrigatórios",
    });
  }

  const numeroValorAlvo = Number(valorAlvo);
  if (!Number.isFinite(numeroValorAlvo) || numeroValorAlvo <= 0) {
    return res.status(400).json({ erro: "Valor alvo inválido" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  if (index === -1) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const metas = usuarios[index].metas || [];
  const metaIndex = metas.findIndex((m) => m.id === id);

  if (metaIndex === -1) {
    return res.status(404).json({ erro: "Meta não encontrada" });
  }

  const meta = metas[metaIndex];
  const valorAtual = meta.valorAtual || 0;

  if (numeroValorAlvo < valorAtual) {
    return res.status(400).json({
      erro: "Valor alvo não pode ser menor que o valor já aportado",
    });
  }

  const atualizada = {
    ...meta,
    titulo,
    valorAlvo: numeroValorAlvo,
    dataMeta: String(dataMeta).slice(0, 10),
    descricao: descricao ?? meta.descricao ?? "",
  };

  metas[metaIndex] = atualizada;
  usuarios[index].metas = metas;
  salvarUsuarios(usuarios);

  res.json({ sucesso: true, meta: atualizada });
});

app.delete("/api/metas/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const metasAntes = usuarios[index].metas || [];
  const metaExiste = metasAntes.find((m) => m.id === id);

  if (!metaExiste) {
    return res.status(404).json({ erro: "Meta não encontrada" });
  }

  usuarios[index].metas = metasAntes.filter((m) => m.id !== id);
  salvarUsuarios(usuarios);

  res.json({ sucesso: true });
});

// ===== APORTAR NA META =====
app.patch("/api/metas/:id/aportar", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const { valor } = req.body;
  const valorNumero = Number(valor);

  if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
    return res.status(400).json({ erro: "Valor inválido" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const meta = usuarios[index].metas?.find((m) => m.id === id);
  if (!meta) return res.status(404).json({ erro: "Meta não encontrada" });

  meta.valorAtual = (meta.valorAtual || 0) + valorNumero;

  salvarUsuarios(usuarios);
  res.json({ meta });
});

// ===== DESAPORTAR DA META =====
app.patch("/api/metas/:id/desaportar", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const { valor } = req.body;
  const valorNumero = Number(valor);

  if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
    return res.status(400).json({ erro: "Valor inválido" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const meta = usuarios[index].metas?.find((m) => m.id === id);
  if (!meta) return res.status(404).json({ erro: "Meta não encontrada" });

  meta.valorAtual = Math.max(0, (meta.valorAtual || 0) - valorNumero);

  salvarUsuarios(usuarios);
  res.json({ meta });
});

// ===== INICIALIZAÇÃO DO SERVIDOR =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Usuários salvos em: ${USUARIOS_FILE}`);
});