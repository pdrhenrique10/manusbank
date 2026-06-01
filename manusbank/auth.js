// auth.js - ES module
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USUARIOS_FILE = path.join(__dirname, "usuarios.json");
let usuarioLogado = null;

function carregarUsuarios() {
  try {
    if (fs.existsSync(USUARIOS_FILE)) {
      const dados = fs.readFileSync(USUARIOS_FILE, "utf8");
      return JSON.parse(dados);
    }
  } catch (error) {
    console.error("Erro ao carregar usuarios:", error.message);
  }
  return [];
}

function salvarUsuarios(usuarios) {
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2));
}

function criptografarSenha(senha) {
  return crypto.createHash("sha256").update(senha).digest("hex");
}

function validarCamposPreenchidos(campos) {
  const erros = [];
  for (const campo in campos) {
    const valor = campos[campo];
    if (!valor || valor.trim() === "") {
      erros.push(campo);
    }
  }
  return erros;
}

export function criarConta(nome, email, senha) {
  const erros = validarCamposPreenchidos({ nome, email, senha });
  if (erros.length > 0) {
    return {
      sucesso: false,
      erro: "Todos os campos são obrigatórios. Preencha: " + erros.join(", "),
    };
  }

  const usuarios = carregarUsuarios();

  const emailExistente = usuarios.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (emailExistente) {
    return {
      sucesso: false,
      erro: "Este email já está cadastrado. Tente fazer login.",
    };
  }

  const novoUsuario = {
    id: Date.now(),
    nome: nome.trim(),
    email: email.toLowerCase().trim(),
    senha: criptografarSenha(senha),
    saldo: 0,
    transacoes: [],
    criadoEm: new Date().toISOString(),
  };

  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);
  usuarioLogado = novoUsuario;

  return {
    sucesso: true,
    mensagem: "Conta criada com sucesso!",
    usuario: {
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      saldo: novoUsuario.saldo,
    },
  };
}

export function fazerLogin(email, senha) {
  const erros = validarCamposPreenchidos({ email, senha });
  if (erros.length > 0) {
    return {
      sucesso: false,
      erro: "Todos os campos são obrigatórios. Preencha: " + erros.join(", "),
    };
  }

  const usuarios = carregarUsuarios();
  const usuario = usuarios.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!usuario) {
    return {
      sucesso: false,
      erro: "Email não encontrado. Crie uma conta primeiro.",
    };
  }

  if (usuario.senha !== criptografarSenha(senha)) {
    return {
      sucesso: false,
      erro: "Senha incorreta.",
    };
  }

  usuarioLogado = usuario;

  return {
    sucesso: true,
    mensagem: "Login realizado com sucesso!",
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      saldo: usuario.saldo || 0,
    },
  };
}

export function estaLogado() {
  return usuarioLogado !== null;
}

export function obterUsuarioLogado() {
  return usuarioLogado;
}

export function fazerLogout() {
  usuarioLogado = null;
}

export function obterSaldo() {
  if (!usuarioLogado) return 0;
  return usuarioLogado.saldo || 0;
}

export function obterTransacoes() {
  if (!usuarioLogado) return [];
  return usuarioLogado.transacoes || [];
}

// FUNÇÃO CORRIGIDA - Agora aceita e processa a data explicitamente
export function adicionarTransacao(tipo, valor, descricao = "", dataTransacao = null, categoria = null) {
  console.log("=== ADICIONAR TRANSACAO ===");
  console.log("Parâmetros recebidos:", { tipo, valor, descricao, dataTransacao, categoria });
  
  if (!usuarioLogado) {
    return { sucesso: false, erro: "Usuário não está logado" };
  }

  const usuarios = carregarUsuarios();
  const index = usuarios.findIndex((u) => u.id === usuarioLogado.id);
  if (index === -1) {
    return { sucesso: false, erro: "Usuário não encontrado" };
  }

  // TRATAMENTO EXPLÍCITO DA DATA
  let dataFinal;
  
  if (dataTransacao) {
    console.log("Data recebida do frontend:", dataTransacao);
    
    // Se já está no formato YYYY-MM-DD (formato de input date do HTML)
    if (typeof dataTransacao === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dataTransacao)) {
      dataFinal = dataTransacao;
      console.log("Data no formato YYYY-MM-DD:", dataFinal);
    } 
    // Se for uma data ISO ou outro formato
    else {
      try {
        const dateObj = new Date(dataTransacao);
        // Verifica se a data é válida
        if (!isNaN(dateObj.getTime())) {
          // IMPORTANTE: Ajusta para o fuso horário local para evitar problemas
          const ano = dateObj.getFullYear();
          const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
          const dia = String(dateObj.getDate()).padStart(2, '0');
          dataFinal = `${ano}-${mes}-${dia}`;
          console.log("Data convertida:", dataFinal);
        } else {
          console.log("Data inválida, usando data atual");
          dataFinal = obterDataAtualFormatada();
        }
      } catch (e) {
        console.error("Erro ao processar data:", e);
        dataFinal = obterDataAtualFormatada();
      }
    }
  } else {
    console.log("Nenhuma data fornecida, usando data atual");
    dataFinal = obterDataAtualFormatada();
  }
  
  console.log("Data final que será salva:", dataFinal);

  const transacao = {
    id: Date.now(),
    tipo,
    valor: Number(valor),
    descricao: descricao || "",
    data: dataFinal,
    categoria: categoria || descricao || "Geral",
  };

  console.log("Transação criada:", transacao);

  if (!usuarios[index].transacoes) {
    usuarios[index].transacoes = [];
  }

  usuarios[index].transacoes.push(transacao);

  if (tipo === "deposito" || tipo === "transferenciaEntrada") {
    usuarios[index].saldo = (usuarios[index].saldo || 0) + Number(valor);
  } else if (tipo === "saque" || tipo === "transferenciaSaida") {
    usuarios[index].saldo = (usuarios[index].saldo || 0) - Number(valor);
  }

  usuarioLogado = usuarios[index];
  salvarUsuarios(usuarios);
  
  console.log("Transação salva com sucesso. Data:", dataFinal);
  console.log("=== FIM ADICIONAR TRANSACAO ===");

  return { 
    sucesso: true, 
    transacao, 
    saldo: usuarios[index].saldo 
  };
}

// Função auxiliar para obter data atual formatada
function obterDataAtualFormatada() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Função de remover transação (mantida igual)
export function removerTransacao(idTransacao) {
  if (!usuarioLogado) {
    return { sucesso: false, erro: "Usuário não está logado" };
  }

  const usuarios = carregarUsuarios();
  const indexUsuario = usuarios.findIndex((u) => u.id === usuarioLogado.id);
  if (indexUsuario === -1) {
    return { sucesso: false, erro: "Usuário não encontrado" };
  }

  const user = usuarios[indexUsuario];
  if (!user.transacoes) {
    return { sucesso: false, erro: "Nenhuma transação encontrada" };
  }

  const indexTransacao = user.transacoes.findIndex(
    (t) => t.id === idTransacao
  );

  if (indexTransacao === -1) {
    return { sucesso: false, erro: "Transação não encontrada" };
  }

  const transacaoRemovida = user.transacoes[indexTransacao];

  const valor = Number(transacaoRemovida.valor) || 0;
  if (
    transacaoRemovida.tipo === "deposito" ||
    transacaoRemovida.tipo === "transferenciaEntrada"
  ) {
    user.saldo = (user.saldo || 0) - valor;
  } else if (
    transacaoRemovida.tipo === "saque" ||
    transacaoRemovida.tipo === "transferenciaSaida"
  ) {
    user.saldo = (user.saldo || 0) + valor;
  }

  user.transacoes.splice(indexTransacao, 1);

  usuarios[indexUsuario] = user;
  usuarioLogado = user;
  salvarUsuarios(usuarios);

  return { 
    sucesso: true, 
    transacaoRemovida, 
    saldo: user.saldo 
  };
}