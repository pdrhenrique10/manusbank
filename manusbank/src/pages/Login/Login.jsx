import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha email e senha.");
      return;
    }

    setCarregando(true);

    try {
      const resp = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resp.json();

      if (!resp.ok) {
        // Exibe o erro retornado pelo backend
        setErro(dados.erro || "Erro ao fazer login. Tente novamente.");
        setCarregando(false);
        return;
      }

      // Sucesso no backend
      localStorage.setItem("token", dados.token);
      localStorage.setItem("user", JSON.stringify({
        uid: dados.user?.id || Date.now().toString(),
        email,
        name: dados.user?.nome || email.split("@")[0],
      }));
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Erro na conexão:", error);
      setErro("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
      setCarregando(false);
    }
  }

  return (
    <div className="login-container">
      <div className="left-panel">
        <h1>
          Novo usuário? <span className="destaque">Cadastre-se</span> aqui.
        </h1>
        <button className="signin-btn" onClick={() => navigate("/register")}>
          Criar conta
        </button>
      </div>

      <div className="right-panel">
        <h1>Faça login na sua conta</h1>
        {erro && <p className="error-msg">{erro}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <button type="submit" className="signup-btn" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}