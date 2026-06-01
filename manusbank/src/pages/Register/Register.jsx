import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleRegister() {
    setErro("");
    setSucesso("");

    // validação no frontend
    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      setErro("Preencha todos os campos.");
      return; // não avança
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      const resp = await fetch("http://localhost:3000/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      const dados = await resp.json();

      if (!resp.ok) {
        setErro(dados.erro || "Erro ao registrar.");
        return; // não avança
      }

      setSucesso("Conta criada com sucesso!");
      // você pode ir direto para o dashboard ou voltar pro login:
      navigate("/login");
      // ou navigate("/dashboard");
    } catch (e) {
      console.error(e);
      setErro("Erro ao conectar com o servidor.");
    }
  }

  return (
    <div className="register-container">
      <div className="left-panel">
        <h1>Já possui conta?</h1>
        <p>
          Entre agora para <span className="destaque2">desfrutar dos seus benefícios</span>.
        </p>

        <button
          className="signin-btn"
          onClick={() => navigate("/dashboard")}
        >
          Entre na sua conta
        </button>
      </div>

      <div className="right-panel">
        <h1>Criar Conta</h1>

        {erro && <p className="error-msg">{erro}</p>}
        {sucesso && <p className="success-msg">{sucesso}</p>}

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

        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
        />

        <button className="signup-btn" onClick={handleRegister}>
          Registrar
        </button>
      </div>
    </div>
  );
}