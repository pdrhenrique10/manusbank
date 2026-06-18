import "./Register.css"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { API_URL } from "../../config/api"

export default function Register() {
  const navigate = useNavigate()

  // Estados para os inputs
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const togglePasswordVisibility = () => setShowPassword(!showPassword)
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword)

  const handleRegister = async (e) => {
    e.preventDefault() 

    // 1. VALIDAÇÕES
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      alert("Por favor, preencha todos os campos.")
      return
    }

    if (password !== confirmPassword) {
      alert("As senhas não coincidem. Digite novamente.")
      return
    }

    if (password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    // 2. INICIA O CARREGAMENTO
    setIsLoading(true)

    try {
      // 3. REQUISIÇÃO PARA O BACK-END NO RENDER
      const response = await fetch(`${API_URL}/api/register`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: name.trim(),
          email: email.trim(),
          senha: password.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.msg || data.error || "Erro ao cadastrar. Tente novamente.")
        setIsLoading(false)
        return
      }

      // 4. SUCESSO!
      // O Back-end retorna um token JWT real. Vamos salvá-lo e ir direto para o Dashboard.
      if (data.token) {
        localStorage.setItem("token", data.token) // Salva o token real
        setIsLoading(false)
        navigate("/dashboard") // Vai direto para o sistema
      } else {
        alert("Erro inesperado: Token não recebido do servidor.")
        setIsLoading(false)
      }

    } catch (error) {
      console.error("Erro de conexão com a API:", error)
      alert("Não foi possível conectar ao servidor. Verifique sua internet.")
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page-container">
      <div className="login-card">
        
        {/* Lado Esquerdo: Formulário */}
        <div className="login-form-panel">
          <h1 className="login-title">
            Crie sua conta<span className="login-dot">.</span>
          </h1>

          <div className="form-group">
            <label htmlFor="name">Nome completo</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Digite seu nome" 
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input 
              type="email" 
              id="email" 
              placeholder="Digite seu e-mail" 
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Crie uma senha"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirme sua senha"
                className="input-field input-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

          <button 
            className="login-button" 
            onClick={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? "Cadastrando..." : "Registrar"}
          </button>

          <div className="register-link" onClick={() => navigate("/login")}>
            Já tem uma conta? <span>Faça login</span>
          </div>

          {/* Botão para voltar à Home */}
          <button className="back-home-button" onClick={() => navigate("/")}>
            <ArrowLeft size={16} /> Voltar à tela inicial
          </button>

        </div>

        {/* Lado Direito: Logo do Site */}
        <div className="login-image-panel">
          <div className="brand-display">
            <img src="/mflogo.jpeg" alt="Logo ManusFinance" className="login-logo" />
            <span className="login-brand-name">ManusFinance</span>
          </div>
        </div>

      </div>
    </div>
  )
}