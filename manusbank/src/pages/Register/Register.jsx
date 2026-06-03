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
  const [carregando, setCarregando] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (
      !nome.trim() ||
      !email.trim() ||
      !senha.trim() ||
      !confirmarSenha.trim()
    ) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      const resp = await fetch("http://localhost:3000/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      const dados = await resp.json();

      if (!resp.ok) {
        setErro(dados.erro || "Erro ao registrar. Tente novamente.");
        setCarregando(false);
        return;
      }

      localStorage.setItem("token", dados.token);

      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: dados.user?.id || Date.now().toString(),
          email,
          name: nome,
        })
      );

      setSucesso("Conta criada com sucesso! Redirecionando...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Erro na conexão:", error);
      setErro(
        "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
      );
      setCarregando(false);
    }
  }

  return (
    <div className="register-container">
      {/* Botão Home */}
      <button
        className="back-home-btn"
        onClick={() => navigate("/")}
      >
        ← 
      </button>

      <div className="left-panel">
        <h1>Já possui conta?</h1>

        <p>
          Entre agora para{" "}
          <span className="destaque2">
            desfrutar dos seus benefícios
          </span>.
        </p>

        <button
          className="signin-btn"
          onClick={() => navigate("/login")}
        >
          Entre na sua conta
        </button>
      </div>

      <div className="right-panel">
        <h1>Criar Conta</h1>

        {erro && <p className="error-msg">{erro}</p>}
        {sucesso && <p className="success-msg">{sucesso}</p>}

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            autoComplete="off"
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            autoComplete="off"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            autoComplete="off"
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmarSenha}
            autoComplete="off"
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
          />

          <button
            type="submit"
            className="signup-btn"
            disabled={carregando}
          >
            {carregando ? "Registrando..." : "Registrar"}
          </button>
        </form>
      </div>
    </div>
  );
}