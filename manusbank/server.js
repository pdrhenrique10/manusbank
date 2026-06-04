import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USUARIOS_FILE = path.join(__dirname, "usuarios.json");

if (!fs.existsSync(USUARIOS_FILE)) {
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify([], null, 2));
}

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// ===== FUNÇÕES AUXILIARES =====
function criptografarSenha(senha) {
  return crypto.createHash("sha256").update(senha).digest("hex");
}

function carregarUsuarios() {
  try {
    return JSON.parse(fs.readFileSync(USUARIOS_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

function salvarUsuarios(usuarios) {
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2));
}

// Retorna a data atual no fuso local, formato YYYY-MM-DD
function dataHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// ===== LÓGICA DE PERÍODO =====
//
// Cada período define uma janela: [dataInicio, dataFim].
// dataFim é sempre hoje.
// dataInicio varia por período:
//
//   "mes"  → 1º dia do mês atual
//   "3m"   → hoje − 90 dias (últimos 3 meses corridos)
//   "6m"   → hoje − 180 dias (últimos 6 meses corridos)
//   "ano"  → 1º de janeiro do ano atual
//
// Uma transação entra no filtro se:
//   dataInicio <= t.data <= dataFim
//
// NOTA: mesmo que o período "não tenha passado todo" (ex: estamos no
// dia 4 e o período é "esse mês"), os dados existentes são exibidos
// normalmente. O frontend mostra o que há, e o backend sinaliza
// se há ou não dados via `temDados`.

function calcularJanela(periodo) {
  const hoje = dataHoje(); // "YYYY-MM-DD"
  const [ano, mes] = hoje.split("-").map(Number);

  let dataInicio;

  if (periodo === "mes") {
    // Do 1º dia do mês atual até hoje
    dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;

  } else if (periodo === "3m") {
    // Últimos 90 dias corridos
    const d = new Date();
    d.setDate(d.getDate() - 90);
    dataInicio = d.toISOString().slice(0, 10);

  } else if (periodo === "6m") {
    // Últimos 180 dias corridos
    const d = new Date();
    d.setDate(d.getDate() - 180);
    dataInicio = d.toISOString().slice(0, 10);

  } else if (periodo === "ano") {
    // Do 1º de janeiro do ano atual até hoje
    dataInicio = `${ano}-01-01`;

  } else {
    // Fallback: mês atual
    dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  }

  return { dataInicio, dataFim: hoje };
}

function dentroDoPeriodo(dataStr, dataInicio, dataFim) {
  // Comparação de strings funciona corretamente para datas no formato YYYY-MM-DD
  return dataStr >= dataInicio && dataStr <= dataFim;
}

// Middleware de autenticação
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ erro: "Token inválido" });
  }

  const usuarios = carregarUsuarios();
  const usuario = usuarios.find((u) => u.email === token);

  if (!usuario) {
    return res.status(401).json({ erro: "Usuário não encontrado. Faça login novamente." });
  }

  req.usuario = usuario;
  req.usuarioEmail = token;
  next();
}

// ===== ROTAS PÚBLICAS =====

app.post("/api/registro", (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const usuarios = carregarUsuarios();
  const emailExiste = usuarios.find((u) => u.email === email);

  if (emailExiste) {
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

  res.json({
    sucesso: true,
    token: email,
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

  res.json({
    sucesso: true,
    token: email,
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

// ===== RELATÓRIOS =====
app.get("/api/relatorios", autenticar, (req, res) => {
  const transacoes = req.usuario.transacoes || [];
  const saldo = req.usuario.saldo || 0;

  const periodosValidos = ["mes", "3m", "6m", "ano"];
  const periodo = periodosValidos.includes(req.query.periodo) ? req.query.periodo : "mes";

  // Define a janela de datas com base no período selecionado
  const { dataInicio, dataFim } = calcularJanela(periodo);

  const tiposReceita = ["deposito", "transferenciaEntrada"];
  const tiposDespesa = ["saque", "transferenciaSaida"];

  let totalReceitas = 0;
  let totalDespesas = 0;
  const despesasPorCategoria = {};
  const evolucaoPorMes = {};

  // Filtra apenas as transações dentro da janela [dataInicio, dataFim]
  const transacoesFiltradas = transacoes.filter((t) =>
    t.data && dentroDoPeriodo(t.data, dataInicio, dataFim)
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
    }

    if (tiposDespesa.includes(t.tipo)) {
      totalDespesas += valor;
      evolucaoPorMes[mesKey].despesas += valor;

      const categoria = t.categoria || t.descricao || "Outros";
      despesasPorCategoria[categoria] = (despesasPorCategoria[categoria] || 0) + valor;
    }
  });

  const categoriasArray = Object.entries(despesasPorCategoria)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  const evolucaoMensal = Object.values(evolucaoPorMes).sort((a, b) =>
    a.nome.localeCompare(b.nome)
  );

  // temDados é a fonte da verdade — o frontend não precisa recalcular
  const temDados = transacoesFiltradas.length > 0;

  // Mensagem descritiva para o frontend exibir quando não há dados
  const labelsPeriodo = { mes: "este mês", "3m": "nos últimos 3 meses", "6m": "nos últimos 6 meses", ano: "este ano" };
  const mensagem = temDados
    ? null
    : `Você ainda não registrou nenhuma transação ${labelsPeriodo[periodo]}.`;

  res.json({
    periodo,
    dataInicio,  // Exposto para o frontend exibir a janela exata ao usuário se quiser
    dataFim,
    saldoAtual: saldo,
    totalReceitas,
    totalDespesas,
    despesasPorCategoria: categoriasArray,
    evolucaoMensal,
    temDados,
    mensagem,
  });
});

// ===== TRANSAÇÕES =====
app.post("/api/transacao", autenticar, (req, res) => {
  const { tipo, valor, descricao, data, categoria } = req.body;

  const dataTransacao = data || dataHoje();

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const novaTransacao = {
    id: Date.now(),
    tipo,
    valor: Number(valor),
    descricao: descricao || "",
    data: dataTransacao,
    categoria: categoria || descricao || "Geral",
  };

  usuarios[index].transacoes = usuarios[index].transacoes || [];
  usuarios[index].transacoes.push(novaTransacao);

  if (tipo === "deposito" || tipo === "transferenciaEntrada") {
    usuarios[index].saldo = (usuarios[index].saldo || 0) + Number(valor);
  } else {
    usuarios[index].saldo = (usuarios[index].saldo || 0) - Number(valor);
  }

  salvarUsuarios(usuarios);

  res.json({
    sucesso: true,
    transacao: novaTransacao,
    saldo: usuarios[index].saldo,
  });
});

app.delete("/api/transacao/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

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

// ===== CONTAS A RECEBER =====
app.get("/api/contas-receber", autenticar, (req, res) => {
  res.json(req.usuario.contasReceber || []);
});

app.post("/api/contas-receber", autenticar, (req, res) => {
  const { cliente, valor, vencimento, descricao } = req.body;
  if (!cliente || !valor || !vencimento) {
    return res.status(400).json({ erro: "Cliente, valor e vencimento são obrigatórios" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const nova = {
    id: req.usuario.nextContaReceberId || 1,
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
  usuarios[index].nextContaReceberId = (usuarios[index].nextContaReceberId || 1) + 1;

  salvarUsuarios(usuarios);
  res.status(201).json(nova);
});

app.patch("/api/contas-receber/:id/pagar", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const contas = usuarios[index].contasReceber || [];
  const conta = contas.find((c) => c.id === id);

  if (!conta) return res.status(404).json({ erro: "Conta não encontrada" });
  if (conta.status === "pago") return res.status(400).json({ erro: "Conta já está paga" });

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

  usuarios[index].contasReceber = (usuarios[index].contasReceber || []).filter((c) => c.id !== id);
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
    return res.status(400).json({ erro: "Título, valor e vencimento são obrigatórios" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const nova = {
    id: req.usuario.nextContaPagarId || 1,
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
  usuarios[index].nextContaPagarId = (usuarios[index].nextContaPagarId || 1) + 1;

  salvarUsuarios(usuarios);
  res.status(201).json(nova);
});

app.patch("/api/contas-pagar/:id/pagar", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const contas = usuarios[index].contasPagar || [];
  const conta = contas.find((c) => c.id === id);

  if (!conta) return res.status(404).json({ erro: "Conta não encontrada" });
  if (conta.status === "pago") return res.status(400).json({ erro: "Conta já está paga" });

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

  usuarios[index].contasPagar = (usuarios[index].contasPagar || []).filter((c) => c.id !== id);
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
    return res.status(400).json({ erro: "Título, valor alvo e data são obrigatórios" });
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.email === req.usuarioEmail);

  const novaMeta = {
    id: req.usuario.nextMetaId || 1,
    titulo,
    valorAlvo: Number(valorAlvo),
    valorAtual: 0,
    dataMeta: String(dataMeta).slice(0, 10),
    descricao: descricao || "",
    dataCriacao: dataHoje(),
  };

  usuarios[index].metas = usuarios[index].metas || [];
  usuarios[index].metas.push(novaMeta);
  usuarios[index].nextMetaId = (usuarios[index].nextMetaId || 1) + 1;

  salvarUsuarios(usuarios);
  res.status(201).json(novaMeta);
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

// ===== INICIALIZAÇÃO DO SERVIDOR =====
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Usuários salvos em: ${USUARIOS_FILE}`);
});