import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USUARIOS_FILE = path.join(__dirname, "usuarios.json");
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "troque-esta-chave-em-producao";

if (!fs.existsSync(USUARIOS_FILE)) {
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify([], null, 2));
}

const app = express();
app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

function criptografarSenha(senha) {
  return crypto.createHash("sha256").update(senha).digest("hex");
}

function carregarUsuarios() {
  try {
    return JSON.parse(fs.readFileSync(USUARIOS_FILE, "utf8"));
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

function calcularJanela(periodo) {
  const hoje = dataHoje();
  const [ano, mes] = hoje.split("-").map(Number);
  let dataInicio;

  if (periodo === "3m") {
    const d = new Date(ano, mes - 1, 1);
    d.setMonth(d.getMonth() - 2);
    dataInicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  } else if (periodo === "6m") {
    const d = new Date(ano, mes - 1, 1);
    d.setMonth(d.getMonth() - 5);
    dataInicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
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
      return res.status(401).json({ erro: "Usuário não encontrado. Faça login novamente." });
    }

    req.usuario = usuario;
    req.usuarioEmail = usuario.email;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

app.post("/api/registro", (req, res) => {
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
    return res.status(401).json({ erro: "Conta não encontrada. Faça o registro primeiro." });
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
  const periodo = periodosValidos.includes(req.query.periodo) ? req.query.periodo : "mes";
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
      receitasPorCategoria[categoria] = (receitasPorCategoria[categoria] || 0) + valor;
    }

    if (tiposDespesa.includes(t.tipo)) {
      totalDespesas += valor;
      evolucaoPorMes[mesKey].despesas += valor;
      const categoria = t.categoria || t.descricao || "Outros";
      despesasPorCategoria[categoria] = (despesasPorCategoria[categoria] || 0) + valor;
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
  const taxaEconomia = totalReceitas > 0 ? (sobra / totalReceitas) * 100 : 0;

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
    const nomeMes = new Date(ano, parseInt(mes) - 1).toLocaleString("pt-BR", {
      month: "short",
    });

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
    gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + valor;
  });

  const categorias = Object.entries(gastosPorCategoria)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  res.json({
    comparativoMensal,
    gastosPorCategoria: categorias,
    totalEntradas: comparativoMensal.reduce((sum, m) => sum + m.entradas, 0),
    totalGastos: comparativoMensal.reduce((sum, m) => sum + m.gastos, 0),
  });
});

app.post("/api/transacao", autenticar, (req, res) => {
  const { tipo, valor, descricao, data, categoria } = req.body;
  const numeroValor = Number(valor);

  if (!tipo || !Number.isFinite(numeroValor) || numeroValor <= 0) {
    return res.status(400).json({ erro: "Tipo e valor válidos são obrigatórios" });
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

  res.json({ sucesso: true, transacao: novaTransacao, saldo: usuarios[index].saldo });
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

  if (removida.tipo === "deposito" || removida.tipo === "transferenciaEntrada") {
    usuarios[index].saldo -= removida.valor;
  } else {
    usuarios[index].saldo += removida.valor;
  }

  usuarios[index].transacoes = transacoes;
  salvarUsuarios(usuarios);

  res.json({ sucesso: true, removida, saldo: usuarios[index].saldo });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Usuários salvos em: ${USUARIOS_FILE}`);
});