// pages/Home/Home.jsx
import "./Home.css"
import { useNavigate } from "react-router-dom"
import {
  BarChart3,
  Wallet,
  Target,
  ArrowRight,
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

  return (
    <div className="home">

      {/* NAVBAR */}
      <header className="navbar">
        <div className="navbar-brand">
          <img src="/mflogo.jpeg" alt="Logo ManusFinance" className="logo-image" />
          <span className="logo">ManusFinance</span>
        </div>
        <nav className="navbar-links">
          <a href="#">Início</a>
          <a href="#funcionalidades">Funcionalidades</a>
        </nav>
      </header>

      {/* HERO - COM IMAGEM DE FUNDO SÓ NESSA SEÇÃO */}
      <section className="hero-bg">
        <div className="hero">
          <h1 className="title">
            Suas finanças,
            <span>organizadas de verdade.</span>
          </h1>

          {/* Frase de impacto direto (Curiosidade transformada em Marketing) */}
          <p className="hero-impact">
            <strong>81,6%</strong> das famílias brasileiras estão endividadas.
            Não seja mais um. Organize sua vida financeira agora.
          </p>

          <p className="description">
            Registre receitas, controle despesas e acompanhe suas metas em um só lugar.
          </p>

          <div className="buttons">
            <button className="primary-btn" onClick={() => navigate("/login")}>
              Começar agora <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES (Apenas o essencial) */}
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

      {/* FOOTER (Limpo) */}
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