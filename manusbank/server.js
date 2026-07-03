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

const MOEDAS_VALIDAS = ["BRL", "USD", "EUR", "GBP"];
const PLANOS_VALIDOS = ["gratis", "premium"];

if (!fs.existsSync(USUARIOS_FILE)) {
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify([], null, 2));
}

const app = express();

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

const LOCALES_DIR = path.join(__dirname, "locales");
app.use("/locales", express.static(LOCALES_DIR));

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

function formatarDataLocal(date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function ultimoDiaDoMes(ano, mes) {
  return new Date(ano, mes, 0).getDate();
}

function normalizarDataReferencia(valor) {
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return valor;
  }
  return dataHoje();
}

// ===== TAXAS DE CÂMBIO (NOVO) =====
// O backend precisa da sua própria fonte de taxas — antes, só o
// frontend buscava isso (via VITE_EXCHANGERATES_API_KEY, que só existe
// no bundle do Vite e nunca chega no servidor). Sem taxas aqui, toda
// soma que envolvia mais de uma moeda (saldo, relatórios) tratava
// valores de moedas diferentes como se fossem números da mesma moeda.
//
// Convenção idêntica à do CurrencyProvider do frontend: cachedRates[X]
// = quantas unidades de X equivalem a 1 BRL.
let cachedRates = {
  BRL: 1,
  USD: 0.18,
  EUR: 0.17,
  GBP: 0.14,
};
let taxasCarregadasEm = null;

async function atualizarTaxasCambio() {
  const API_KEY = process.env.EXCHANGERATES_API_KEY;
  if (!API_KEY) {
    console.warn(
      "⚠️  EXCHANGERATES_API_KEY não configurada no backend — usando taxas fixas de fallback (menos precisas)."
    );
    return;
  }

  try {
    const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/BRL`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha ao buscar taxas de câmbio");

    const data = await res.json();
    if (data.result !== "success") throw new Error("Erro na resposta da API de câmbio");

    cachedRates = {
      BRL: data.conversion_rates.BRL ?? cachedRates.BRL,
      USD: data.conversion_rates.USD ?? cachedRates.USD,
      EUR: data.conversion_rates.EUR ?? cachedRates.EUR,
      GBP: data.conversion_rates.GBP ?? cachedRates.GBP,
    };
    taxasCarregadasEm = new Date();
    console.log("💱 Taxas de câmbio atualizadas no backend:", cachedRates);
  } catch (err) {
    console.error("Erro ao atualizar taxas de câmbio no backend:", err.message);
  }
}

// Converte um valor de uma moeda pra outra, usando BRL como ponte
// (mesmo princípio do converterEntreMoedas do CurrencyProvider).
function converterValor(valor, deMoeda, paraMoeda) {
  const numero = Number(valor) || 0;
  const origem = MOEDAS_VALIDAS.includes(deMoeda) ? deMoeda : "BRL";
  const destino = MOEDAS_VALIDAS.includes(paraMoeda) ? paraMoeda : "BRL";

  if (origem === destino) return numero;

  const rateOrigem = cachedRates[origem] || 1; // 1 BRL -> origem
  const rateDestino = cachedRates[destino] || 1; // 1 BRL -> destino

  const valorEmBRL = numero / rateOrigem;
  return valorEmBRL * rateDestino;
}

function paraBRL(valor, deMoeda) {
  return converterValor(valor, deMoeda, "BRL");
}

function deBRL(valorEmBRL, paraMoeda) {
  return converterValor(valorEmBRL, "BRL", paraMoeda);
}

// ===== HELPERS DE PLANO/MOEDA =====
function normalizarPlanoUsuario(usuario) {
  const plano = PLANOS_VALIDOS.includes(usuario.plano) ? usuario.plano : "gratis";
  const moedaAtual = MOEDAS_VALIDAS.includes(usuario.moedaAtual)
    ? usuario.moedaAtual
    : "BRL";
  const moedaFixa =
    plano === "gratis"
      ? MOEDAS_VALIDAS.includes(usuario.moedaFixa)
        ? usuario.moedaFixa
        : moedaAtual
      : null;

  return { plano, moedaAtual, moedaFixa };
}

// Moeda que deve ser gravada em qualquer item novo (transação, conta a pagar/receber).
// Sempre decidida pelo servidor com base no usuário autenticado — nunca confiar em
// um campo "moeda" vindo do body do client pra criação desses itens.
function moedaAtualDoUsuario(usuario) {
  return normalizarPlanoUsuario(usuario).moedaAtual;
}

// ===== SALDO (CORRIGIDO) =====
// Antes: usuario.saldo era um contador incrementado/decrementado em
// cada rota (+= / -=) sempre com o valor cru da transação, ignorando
// a moeda dela. Se o usuário Premium trocasse de moeda ao longo do
// tempo, esse contador virava uma soma de BRL + USD + EUR como se
// fossem a mesma unidade — silenciosamente errado, sem nenhum erro
// visível.
//
// Agora: o saldo NUNCA é incrementado manualmente. Ele é sempre
// recalculado do zero a partir do histórico de transações (a fonte
// de verdade), convertendo cada uma pra BRL antes de somar. Isso tem
// uma vantagem extra: se o usuarios.json já tem saldo desalinhado por
// causa do bug antigo, ele se autocorrige na primeira leitura — sem
// precisar de migração manual nos dados existentes.
function calcularSaldoBRL(usuario) {
  const transacoes = usuario.transacoes || [];
  return transacoes.reduce((acc, t) => {
    const valorEmBRL = paraBRL(t.valor, t.moeda || "BRL");
    if (t.tipo === "deposito" || t.tipo === "transferenciaEntrada") {
      return acc + valorEmBRL;
    }
    if (t.tipo === "saque" || t.tipo === "transferenciaSaida") {
      return acc - valorEmBRL;
    }
    return acc;
  }, 0);
}

// Atualiza usuario.saldo (sempre em BRL) e devolve o valor em BRL —
// chamar depois de qualquer alteração em transacoes.
function recalcularEsalvarSaldo(usuario) {
  usuario.saldo = calcularSaldoBRL(usuario);
  return usuario.saldo;
}

// ===== LÓGICA DE PERÍODO =====
function calcularJanela(periodo, hojeStr = dataHoje()) {
  const hoje = normalizarDataReferencia(hojeStr);
  const [anoStr, mesStr, diaStr] = hoje.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr);
  const dia = Number(diaStr);

  if (periodo === "mes") {
    const ultimoDia = ultimoDiaDoMes(ano, mes);
    return {
      dataInicio: `${anoStr}-${mesStr}-01`,
      dataFim: `${anoStr}-${mesStr}-${String(ultimoDia).padStart(2, "0")}`,
    };
  }

  const inicio = new Date(ano, mes - 1, dia);

  if (periodo === "1m") {
    inicio.setMonth(inicio.getMonth() - 1);
  } else if (periodo === "3m") {
    inicio.setMonth(inicio.getMonth() - 3);
  } else if (periodo === "6m") {
    inicio.setMonth(inicio.getMonth() - 6);
  } else if (periodo === "ano") {
    inicio.setFullYear(inicio.getFullYear() - 1);
  } else {
    const ultimoDia = ultimoDiaDoMes(ano, mes);
    return {
      dataInicio: `${anoStr}-${mesStr}-01`,
      dataFim: `${anoStr}-${mesStr}-${String(ultimoDia).padStart(2, "0")}`,
    };
  }

  return { dataInicio: formatarDataLocal(inicio), dataFim: hoje };
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
  const { nome, email, senha, plano, moeda } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const planoFinal = plano === "premium" ? "premium" : "gratis";
  const moedaFinal = MOEDAS_VALIDAS.includes(moeda) ? moeda : "BRL";

  const usuarios = carregarUsuarios();

  if (usuarios.find((u) => u.email === email)) {
    return res.status(400).json({ erro: "Este email já está cadastrado" });
  }

  const novoUsuario = {
    id: Date.now(),
    nome,
    email,
    senha: criptografarSenha(senha),
    plano: planoFinal,
    moedaAtual: moedaFinal,
    moedaFixa: planoFinal === "gratis" ? moedaFinal : null,
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
    user: {
      id: novoUsuario.id,
      nome,
      email,
      plano: novoUsuario.plano,
      moedaAtual: novoUsuario.moedaAtual,
    },
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
  const { plano, moedaAtual } = normalizarPlanoUsuario(usuario);

  res.json({
    sucesso: true,
    token,
    user: { id: usuario.id, nome: usuario.nome, email, plano, moedaAtual },
  });
});

app.post("/api/logout", (req, res) => {
  res.json({ sucesso: true });
});

// ===== ROTAS DE PLANO/MOEDA =====
app.get("/api/usuario/me", autenticar, (req, res) => {
  const { plano, moedaAtual, moedaFixa } = normalizarPlanoUsuario(req.usuario);

  res.json({
    id: req.usuario.id,
    nome: req.usuario.nome,
    email: req.usuario.email,
    plano,
    moedaAtual,
    moedaFixa,
  });
});

app.patch("/api/usuario/moeda", autenticar, (req, res) => {
  const { moeda } = req.body;

  if (!MOEDAS_VALIDAS.includes(moeda)) {
    return res.status(400).json({ erro: "Moeda inválida" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  if (index === -1) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const { plano } = normalizarPlanoUsuario(usuarios[index]);

  if (plano === "gratis") {
    return res.status(403).json({
      erro:
        "Usuários do plano grátis não podem trocar de moeda. Faça upgrade para o Premium.",
    });
  }

  usuarios[index].plano = plano;
  usuarios[index].moedaAtual = moeda;
  usuarios[index].moedaFixa = null;

  salvarUsuarios(usuarios);

  res.json({ sucesso: true, moedaAtual: usuarios[index].moedaAtual });
});

app.patch("/api/usuario/plano", autenticar, (req, res) => {
  const { plano } = req.body;

  if (!PLANOS_VALIDOS.includes(plano)) {
    return res.status(400).json({ erro: "Plano inválido" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  if (index === -1) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const usuario = usuarios[index];
  const atual = normalizarPlanoUsuario(usuario);

  if (plano === "gratis" && atual.plano === "premium") {
    usuario.moedaFixa = atual.moedaAtual;
  }

  if (plano === "premium") {
    usuario.moedaFixa = null;
  }

  usuario.plano = plano;
  usuario.moedaAtual = atual.moedaAtual;

  salvarUsuarios(usuarios);

  res.json({
    sucesso: true,
    plano: usuario.plano,
    moedaAtual: usuario.moedaAtual,
    moedaFixa: usuario.moedaFixa,
  });
});

// ===== ROTAS PROTEGIDAS =====
app.get("/api/dashboard", autenticar, (req, res) => {
  const transacoes = (req.usuario.transacoes || []).map((t) => ({
    ...t,
    moeda: t.moeda || "BRL",
  }));

  const moedaAtual = moedaAtualDoUsuario(req.usuario);

  // 👇 saldo sempre recalculado a partir das transações (fonte de
  // verdade), não do campo armazenado — evita arrastar qualquer
  // desalinhamento antigo e já devolve na moeda atual do usuário.
  const saldoEmBRL = calcularSaldoBRL(req.usuario);

  res.json({
    usuario: { nome: req.usuario.nome, email: req.usuario.email },
    saldo: deBRL(saldoEmBRL, moedaAtual),
    moedaAtual,
    transacoes,
  });
});

// ===== RELATÓRIOS =====
app.get("/api/relatorios", autenticar, (req, res) => {
  const moedaAtual = moedaAtualDoUsuario(req.usuario);

  const transacoes = (req.usuario.transacoes || []).map((t) => ({
    ...t,
    moeda: t.moeda || "BRL",
  }));
  const periodosValidos = ["mes", "1m", "3m", "6m", "ano"];
  const periodo = periodosValidos.includes(req.query.periodo)
    ? req.query.periodo
    : "mes";
  const hojeReferencia = normalizarDataReferencia(req.query.hoje);

  let dataInicio, dataFim;

  const regexData = /^\d{4}-\d{2}-\d{2}$/;
  if (
    req.query.dataInicio &&
    req.query.dataFim &&
    regexData.test(req.query.dataInicio) &&
    regexData.test(req.query.dataFim)
  ) {
    dataInicio = req.query.dataInicio;
    dataFim = req.query.dataFim;
  } else {
    const janela = calcularJanela(periodo, hojeReferencia);
    dataInicio = janela.dataInicio;
    dataFim = janela.dataFim;
  }

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
    // 👇 CORREÇÃO: converte cada transação da SUA moeda pra moeda
    // atual do usuário antes de somar. Antes somava t.valor cru,
    // misturando moedas diferentes como se fossem a mesma unidade.
    const valor = converterValor(t.valor, t.moeda || "BRL", moedaAtual);
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
    "1m": "no último mês",
    "3m": "nos últimos 3 meses",
    "6m": "nos últimos 6 meses",
    ano: "no último ano",
  };
  const mensagem = temDados
    ? null
    : `Você ainda não registrou nenhuma transação ${labelsPeriodo[periodo]}.`;

  const sobra = totalReceitas - totalDespesas;
  const taxaEconomia =
    totalReceitas > 0 ? (sobra / totalReceitas) * 100 : 0;

  res.json({
    periodo,
    dataInicio,
    dataFim,
    moedaAtual,
    saldoAtual: totalReceitas - totalDespesas,
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
  const moedaAtual = moedaAtualDoUsuario(req.usuario);
  const transacoes = req.usuario.transacoes || [];
  const periodo = req.query.periodo || "mes";
  const hojeReferencia = normalizarDataReferencia(req.query.hoje);
  const { dataInicio, dataFim } = calcularJanela(periodo, hojeReferencia);
  const tiposReceita = ["deposito", "transferenciaEntrada"];
  const tiposDespesa = ["saque", "transferenciaSaida"];
  const dadosPorMes = {};

  transacoes.forEach((t) => {
    if (!t.data || t.data < dataInicio || t.data > dataFim) return;

    const [ano, mes] = t.data.split("-");
    const chave = `${ano}-${mes}`;
    const nomeMes = new Date(ano, parseInt(mes) - 1).toLocaleString("pt-BR", {
      month: "short",
    });

    if (!dadosPorMes[chave]) {
      dadosPorMes[chave] = { mes: nomeMes, entradas: 0, gastos: 0 };
    }

    // 👇 mesma correção: converte pra moeda atual antes de somar
    const valor = converterValor(t.valor, t.moeda || "BRL", moedaAtual);
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
    const valor = converterValor(t.valor, t.moeda || "BRL", moedaAtual);
    gastosPorCategoria[categoria] =
      (gastosPorCategoria[categoria] || 0) + valor;
  });

  const categorias = Object.entries(gastosPorCategoria)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  res.json({
    moedaAtual,
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
    moeda: moedaAtualDoUsuario(usuarios[index]),
    descricao: descricao || "",
    data: dataTransacao,
    categoria: categoria || descricao || "Geral",
  };

  usuarios[index].transacoes = usuarios[index].transacoes || [];
  usuarios[index].transacoes.push(novaTransacao);

  // 👇 saldo recalculado do zero a partir das transações (ver
  // calcularSaldoBRL) — não incrementamos mais manualmente.
  recalcularEsalvarSaldo(usuarios[index]);

  salvarUsuarios(usuarios);

  res.json({
    sucesso: true,
    transacao: novaTransacao,
    saldo: deBRL(usuarios[index].saldo, novaTransacao.moeda),
  });
});

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

  const atualizada = {
    ...antiga,
    tipo,
    valor: numeroValor,
    // moeda NUNCA muda na edição — o item foi criado numa moeda e continua nela
    moeda: antiga.moeda || "BRL",
    descricao: descricao ?? antiga.descricao ?? "",
    data: data || antiga.data || dataHoje(),
    categoria: categoria || descricao || antiga.categoria || "Geral",
  };

  transacoes[transacaoIndex] = atualizada;
  usuarios[index].transacoes = transacoes;

  // 👇 recalculado do zero — não precisamos mais de impactoAntigo/impactoNovo
  recalcularEsalvarSaldo(usuarios[index]);

  salvarUsuarios(usuarios);

  res.json({
    sucesso: true,
    transacao: atualizada,
    saldo: deBRL(usuarios[index].saldo, atualizada.moeda),
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
  usuarios[index].transacoes = transacoes;

  // 👇 recalculado do zero, sem transação removida
  const moedaAtual = moedaAtualDoUsuario(usuarios[index]);
  recalcularEsalvarSaldo(usuarios[index]);

  salvarUsuarios(usuarios);

  res.json({
    sucesso: true,
    removida,
    saldo: deBRL(usuarios[index].saldo, moedaAtual),
  });
});

// ===== CONTAS A RECEBER =====
app.get("/api/contas-receber", autenticar, (req, res) => {
  const contas = (req.usuario.contasReceber || []).map((c) => ({
    ...c,
    moeda: c.moeda || "BRL",
  }));
  res.json(contas);
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
    moeda: moedaAtualDoUsuario(usuarios[index]),
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
    moeda: conta.moeda || "BRL",
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
  conta.moeda = conta.moeda || "BRL";

  const novaTransacao = {
    id: Date.now(),
    tipo: "deposito",
    valor: conta.valor,
    moeda: conta.moeda,
    descricao: `Recebimento: ${conta.cliente}`,
    data: conta.dataRecebimento,
    categoria: "Contas a Receber",
  };

  usuarios[index].transacoes = usuarios[index].transacoes || [];
  usuarios[index].transacoes.push(novaTransacao);

  // 👇 recalculado do zero, já considerando a moeda da conta
  recalcularEsalvarSaldo(usuarios[index]);

  salvarUsuarios(usuarios);
  res.json({
    conta,
    transacao: novaTransacao,
    saldo: deBRL(usuarios[index].saldo, moedaAtualDoUsuario(usuarios[index])),
  });
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
  const contas = (req.usuario.contasPagar || []).map((c) => ({
    ...c,
    moeda: c.moeda || "BRL",
  }));
  res.json(contas);
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
    moeda: moedaAtualDoUsuario(usuarios[index]),
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
    moeda: conta.moeda || "BRL",
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
  conta.moeda = conta.moeda || "BRL";

  const novaTransacao = {
    id: Date.now(),
    tipo: "saque",
    valor: conta.valor,
    moeda: conta.moeda,
    descricao: `Pagamento: ${conta.titulo}`,
    data: conta.dataPagamento,
    categoria: conta.tipo || "Contas a Pagar",
  };

  usuarios[index].transacoes = usuarios[index].transacoes || [];
  usuarios[index].transacoes.push(novaTransacao);

  // 👇 recalculado do zero, já considerando a moeda da conta
  recalcularEsalvarSaldo(usuarios[index]);

  salvarUsuarios(usuarios);
  res.json({
    conta,
    transacao: novaTransacao,
    saldo: deBRL(usuarios[index].saldo, moedaAtualDoUsuario(usuarios[index])),
  });
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
  const metas = req.usuario.metas || [];
  const metasComMoeda = metas.map((m) => ({
    ...m,
    moeda: m.moeda || "BRL",
  }));
  res.json(metasComMoeda);
});

app.post("/api/metas", autenticar, (req, res) => {
  const { titulo, valorAlvo, dataMeta, descricao, moeda } = req.body;
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
    moeda: moeda || "BRL",
    dataCriacao: dataHoje(),
  };

  usuarios[index].metas = usuarios[index].metas || [];
  usuarios[index].metas.push(novaMeta);
  usuarios[index].nextMetaId = (usuarios[index].nextMetaId ?? 1) + 1;

  salvarUsuarios(usuarios);
  res.status(201).json(novaMeta);
});

app.put("/api/metas/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const { titulo, valorAlvo, dataMeta, descricao, moeda } = req.body;

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
    moeda: moeda || meta.moeda || "BRL",
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
// Nota: este endpoint assume que "valor" já chega convertido pra
// moeda ORIGINAL da meta — quem faz essa conversão é o frontend
// (MetasFinanceiras.jsx), já que é lá que sabemos tanto a moeda
// selecionada no momento do aporte quanto a moeda em que a meta foi
// criada.
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
atualizarTaxasCambio();
setInterval(atualizarTaxasCambio, 10 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Usuários salvos em: ${USUARIOS_FILE}`);
  console.log(`🌎 Locales servidos em: ${LOCALES_DIR}`);
});