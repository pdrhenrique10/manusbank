import "./Login.css";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { API_URL } from "../../config/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para mensagens de erro e sucesso
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // Função para limpar mensagens após 5 segundos
  const clearMessages = () => {
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Limpa mensagens anteriores
    setError("");
    setSuccess("");

    // Validação de campos vazios
    if (!email.trim() || !password.trim()) {
      setError("Por favor, preencha o e-mail e a senha para continuar.");
      clearMessages();
      return;
    }

    // Validação de formato de e-mail (básica)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Por favor, insira um e-mail válido.");
      clearMessages();
      return;
    }

    // Validação de tamanho mínimo da senha
    if (password.trim().length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      clearMessages();
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
          senha: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Mensagens específicas do backend
        let errorMsg = data.erro || data.msg || data.error || "E-mail ou senha incorretos.";
        
        // Personaliza mensagens baseadas no que o backend retorna
        if (errorMsg.toLowerCase().includes("não encontrada") || 
            errorMsg.toLowerCase().includes("email não") || 
            errorMsg.toLowerCase().includes("conta não")) {
          errorMsg = "Conta não encontrada. Verifique seu e-mail ou registre-se.";
        } else if (errorMsg.toLowerCase().includes("senha")) {
          errorMsg = "Senha incorreta. Tente novamente.";
        }

        setError(errorMsg);
        setIsLoading(false);
        clearMessages();
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);

        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // Mensagem de sucesso
        setSuccess("Login realizado com sucesso! Redirecionando...");
        setIsLoading(false);
        clearMessages();

        // Redireciona após 1.5 segundos
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setError("Erro inesperado: Token não recebido do servidor.");
        setIsLoading(false);
        clearMessages();
      }
    } catch (error) {
      console.error("Erro de conexão com a API:", error);
      setError("Não foi possível conectar ao servidor. Verifique sua internet.");
      setIsLoading(false);
      clearMessages();
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-form-panel">
          <h1 className="login-title">
            Faça seu login<span className="login-dot">.</span>
          </h1>

          {/* MENSAGEM DE ERRO */}
          {error && (
            <div className="message-box error-box">
              <AlertCircle size={18} className="message-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* MENSAGEM DE SUCESSO */}
          {success && (
            <div className="message-box success-box">
              <CheckCircle size={18} className="message-icon" />
              <span>{success}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              placeholder="O email que você cadastrou"
              className={`input-field ${error && !email.trim() ? "input-error" : ""}`}
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Senha"
                className={`input-field input-password ${error && password.trim().length < 6 && password.trim().length > 0 ? "input-error" : ""}`}
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
            className={`login-button ${isLoading ? "loading" : ""}`}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              "Login"
            )}
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