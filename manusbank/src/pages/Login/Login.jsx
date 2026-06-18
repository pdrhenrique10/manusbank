import "./Login.css";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { API_URL } from "../../config/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Por favor, preencha o e-mail e a senha para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          // backend espera "senha"
          senha: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // backend manda { erro: "..." }
        alert(data.erro || data.msg || data.error || "E-mail ou senha incorretos.");
        setIsLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        setIsLoading(false);
        navigate("/dashboard");
      } else {
        alert("Erro inesperado: Token não recebido do servidor.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro de conexão com a API:", error);
      alert("Não foi possível conectar ao servidor. Verifique sua internet.");
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-form-panel">
          <h1 className="login-title">
            Faça seu login<span className="login-dot">.</span>
          </h1>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              placeholder="E-mail"
              className="input-field"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Senha"
                className="input-field input-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                aria-label="Alternar visibilidade da senha"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="login-button"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Login"}
          </button>

          <div className="register-link" onClick={() => navigate("/register")}>
            Ainda não tem uma conta? <span>Registre-se</span>
          </div>

          <button className="back-home-button" onClick={() => navigate("/")}>
            <ArrowLeft size={16} /> Voltar à tela inicial
          </button>
        </div>

        <div className="login-image-panel">
          <div className="brand-display">
            <img src="/mflogo.jpeg" alt="Logo ManusFinance" className="login-logo" />
            <span className="login-brand-name">ManusFinance</span>
          </div>
        </div>
      </div>
    </div>
  );
}