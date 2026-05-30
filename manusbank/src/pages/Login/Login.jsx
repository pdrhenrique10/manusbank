import { useNavigate } from "react-router-dom"
import "./Login.css"

export default function Login() {
  const navigate = useNavigate()

  return (    
    <div className="login-container">

      <div className="left-panel">
        <h1>Novo usuário? <span className="destaque">Cadastre-se</span> aqui.</h1>

        <button
          className="signin-btn"
          onClick={() => navigate("/register")}
        >
          Criar conta
        </button>
      </div>

      <div className="right-panel">

        <h1>Faça login na sua conta</h1>

        <input
          type="text"
          placeholder="Nome"
        />

        <input
          type="email"
          placeholder="Email"
        />

        <input
          type="password"
          placeholder="Senha"
        />

        <button className="signup-btn" onClick={() => navigate("/dashboard")}>
          Entrar
        </button>

      </div>

    </div>
  )
}
