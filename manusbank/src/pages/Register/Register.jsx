import "./Register.css";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useState } from "react";
import { API_URL } from "../../config/api";

const MOEDAS = [
  { codigo: "BRL", label: "Real (R$)" },
  { codigo: "USD", label: "Dólar (U$)" },
  { codigo: "EUR", label: "Euro (€)" },
  { codigo: "GBP", label: "Libra (£)" },
];

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  // Se o usuário veio da tela de Planos, usa o que ele escolheu lá.
  // Se caiu direto no /register (ex: link direto), assume plano grátis + BRL.
  const planoInicial = location.state?.plano === "premium" ? "premium" : "gratis";
  const moedaInicial = MOEDAS.some((m) => m.codigo === location.state?.moeda)
    ? location.state.moeda
    : "BRL";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [plano] = useState(planoInicial);
  const [moeda, setMoeda] = useState(moedaInicial);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isGratis = plano === "gratis";

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword((prev) => !prev);

  const clearMessages = () => {
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Por favor, preencha todos os campos.");
      clearMessages();
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem. Digite novamente.");
      clearMessages();
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      clearMessages();
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: name.trim(),
          email: email.trim(),
          senha: password.trim(),
          plano,
          moeda,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.erro || data.msg || data.error || "Erro ao cadastrar. Tente novamente.";
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

        setSuccess("Cadastro realizado com sucesso! Redirecionando...");
        setIsLoading(false);
        clearMessages();

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
            Crie sua conta<span className="login-dot">.</span>
          </h1>

          {error && (
            <div className="message-box error-box">
              <AlertCircle size={18} className="message-icon" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="message-box success-box">
              <CheckCircle size={18} className="message-icon" />
              <span>{success}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Nome completo</label>
            <input
              type="text"
              id="name"
              placeholder="Digite seu nome"
              className={`input-field ${error && !name.trim() ? "input-error" : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              placeholder="Digite seu e-mail"
              className={`input-field ${error && !email.trim() ? "input-error" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Crie uma senha"
                className={`input-field input-password ${error && password.length < 6 && password.length > 0 ? "input-error" : ""}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirme sua senha"
                className={`input-field input-password ${error && password !== confirmPassword && confirmPassword.length > 0 ? "input-error" : ""}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={toggleConfirmPasswordVisibility}
                aria-label="Alternar visibilidade da senha"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

{/* SELEÇÃO DE MOEDA */}
<div className="form-group">
  <label htmlFor="moeda">Moeda</label>
  <select
    id="moeda"
    className="input-field"
    value={moeda}
    onChange={(e) => setMoeda(e.target.value)}
  >
    {MOEDAS.map((m) => (
      <option key={m.codigo} value={m.codigo}>
        {m.label}
      </option>
    ))}
  </select>
  {isGratis ? (
    <small className="moeda-aviso">
      No plano grátis essa escolha é definitiva assim que você criar a conta. Pra trocar depois, você vai precisar assinar o Premium.
    </small>
  ) : (
    <small className="moeda-aviso moeda-aviso-premium">
      Plano Premium: você pode trocar de moeda quando quiser, direto nas configurações.
    </small>
  )}
</div>

          <button
            className={`login-button ${isLoading ? "loading" : ""}`}
            onClick={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              "Registrar"
            )}
          </button>

          <div className="register-link" onClick={() => navigate("/login")}>
            Já tem uma conta? <span>Faça login</span>
          </div>

          <button className="back-home-button" onClick={() => navigate("/")}>
            <ArrowLeft size={16} /> Voltar à tela inicial
          </button>
        </div>

        <div className="login-image-panel">
          <div className="brand-display">
            <img
              src="/mflogo.jpeg"
              alt="Logo ManusFinance"
              className="login-logo"
            />
            <span className="login-brand-name">ManusFinance</span>
          </div>
        </div>
      </div>
    </div>
  );
}