// pages/Home/Home.jsx
import { useState } from "react"
import "./Home.css"
import { useNavigate } from "react-router-dom"
import {
  BarChart3,
  Wallet,
  Target,
  ArrowRight,
  Menu,
  X,
} from "lucide-react"

const features = [
  {
    icon: <BarChart3 size={26} />,
    title: "Relatórios visuais",
    desc: "Gráficos interativos que revelam padrões de consumo e facilitam a tomada de decisão.",
  },
  {
    icon: <Wallet size={26} />,
    title: "Controle de gastos",
    desc: "Categorize despesas, acompanhe receitas e mantenha o orçamento sempre em dia.",
  },
  {
    icon: <Target size={26} />,
    title: "Metas financeiras",
    desc: "Defina objetivos e monitore o progresso de cada um de forma clara e visual.",
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  function fecharMenu() {
    setMenuAberto(false)
  }

  function irPara(rota) {
    navigate(rota)
    fecharMenu()
  }

  return (
    <div className="home">

      {/* navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <img src="/mflogo.jpeg" alt="Logo ManusFinance" className="logo-image" />
          <span className="logo">ManusFinance</span>
        </div>

        <nav className="navbar-links">
          <a href="#">Início</a>
          <a href="#funcionalidades">Funcionalidades</a>
          <a onClick={() => navigate("/planos")}>Planos</a>
          <a onClick={() => navigate("/login")}>Entrar</a>
        </nav>

        <button
          className="navbar-hamburguer"
          onClick={() => setMenuAberto((prev) => !prev)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
        >
          {menuAberto ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* menu mobile (dropdown abaixo da navbar) */}
      <div className={`navbar-mobile-menu ${menuAberto ? "aberto" : ""}`}>
        <a href="#" onClick={fecharMenu}>Início</a>
        <a href="#funcionalidades" onClick={fecharMenu}>Funcionalidades</a>
        <a onClick={() => irPara("/planos")}>Planos</a>
        <a onClick={() => irPara("/login")}>Entrar</a>
      </div>

      {/* overlay escuro atrás do menu mobile */}
      {menuAberto && (
        <div className="navbar-mobile-overlay" onClick={fecharMenu} />
      )}

      <section className="hero-bg">
        <div className="hero">
          <h1 className="title">
            Suas finanças,
            <span>organizadas de verdade.</span>
          </h1>

          {/* frase de impacto */}
          <p className="hero-impact">
            <strong>81,6%</strong> das famílias brasileiras estão endividadas.
            Não seja mais um. Organize sua vida financeira agora.
          </p>

          <p className="description">
            Registre receitas, controle despesas e acompanhe suas metas em um só lugar.
          </p>

          <div className="buttons">
            <button className="primary-btn" onClick={() => navigate("/planos")}>
              Começar agora <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* funcionalidades */}
      <section className="section" id="funcionalidades">
        <div className="section-header">
          <h2 className="section-title">Simplifique suas finanças</h2>
          <p className="section-sub">Ferramentas práticas para sair do vermelho e conquistar seus objetivos.</p>
        </div>
        <div className="grid-3">
          {features.map((f, i) => (
            <div className="card" key={i}>
              <div className="card-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="footer">
        <div className="footer-brand">
          <img src="/mflogo.jpeg" alt="ManusFinance" className="logo-image logo-sm" />
          <span>ManusFinance</span>
        </div>
        <p className="footer-copy">SENAI &nbsp;·&nbsp; © {new Date().getFullYear()}
        </p>
      </footer>

    </div>
  )
}