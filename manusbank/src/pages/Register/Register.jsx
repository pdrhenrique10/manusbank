import "./Register.css"

import { useNavigate } from "react-router-dom"

export default function Register() {

  const navigate = useNavigate()

  return (

    <div className="register-container">

      {/* LEFT */}
      <div className="left-panel">

        <h1>
          Já possui conta?
        </h1>

        <p>
          Entre agora para <span className="destaque2">desfrutar dos seus benefícios</span>.
        </p>

        <button
          className="signin-btn"
          onClick={() => navigate("/login")}
        >
          Entre na sua conta
        </button>

      </div>

      {/* RIGHT */}
      <div className="right-panel">

        <h1>
          Criar Conta
        </h1>

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

        <input
          type="password"
          placeholder="Confirmar senha"
        />

        <button className="signup-btn" onClick={() => navigate("/dashboard")}>
          Registrar
        </button>

      </div>

    </div>
  )
}