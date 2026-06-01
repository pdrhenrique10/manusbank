import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function handleLogin() {
    setErro("");

    // validação básica no frontend
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setErro("Preencha nome, email e senha.");
      return; // não avança
    }

    try {
      const resp = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resp.json();

      if (!resp.ok) {
        // backend (auth.js) não aceitou
        setErro(dados.erro || "Erro ao fazer login.");
        return; // não avança para o dashboard
      }

      // login ok → ir para dashboard
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      setErro("Erro ao conectar com o servidor.");
    }
  }

  return (
    <div className="login-container">
      <div className="left-panel">
        <h1>
          Novo usuário? <span className="destaque">Cadastre-se</span> aqui.
        </h1>

        <button
          className="signin-btn"
          onClick={() => navigate("/register")}
        >
          Criar conta
        </button>
      </div>

      <div className="right-panel">
        <h1>Faça login na sua conta</h1>

        {erro && <p className="error-msg">{erro}</p>}

        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button className="signup-btn" onClick={handleLogin}>
          Entrar
        </button>
      </div>
    </div>
  );
}