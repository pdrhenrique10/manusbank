// pages/Home/Home.jsx

import "./Home.css"
import { useNavigate } from "react-router-dom"
import {
  ShieldCheck,
  BarChart3,
  Wallet,
  TrendingUp,
  Target,
  Bell,
  ArrowRight,
  PieChart,
  CreditCard,
  Landmark,
  GraduationCap,
  Users,
  Lightbulb,
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

const steps = [
  {
    icon: <PieChart size={22} />,
    title: "Visualize tudo",
    desc: "Veja o panorama completo das suas finanças num único painel intuitivo.",
  },
  {
    icon: <Landmark size={22} />,
    title: "Tome decisões melhores",
    desc: "Use os relatórios e insights para guardar mais e gastar com consciência.",
  },
]

const about = [
  {
    icon: <GraduationCap size={26} />,
    title: "Projeto acadêmico",
    desc: "Desenvolvido por um grupo de estudantes da turma de Informática para a FeiraTech, que também será utilizado para o TCC do SENAI.",
  },
  {
    icon: <Users size={26} />,
    title: "Foco no usuário",
    desc: "A plataforma foi projetada para ser acessível a qualquer pessoa, independentemente do nível de conhecimento financeiro.",
  },
  {
    icon: <Lightbulb size={26} />,
    title: "Propósito",
    desc: "Ajudar pessoas a organizarem suas finanças pessoais de forma prática, visual e sem complicação.",
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
          <a href="#">Introdução</a>
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#sobre">Sobre</a>
        </nav>
        <button className="nav-cta" onClick={() => navigate("/login")}>
          Entrar
        </button>
      </header>

      {/* HERO */}
      <section className="hero">
        <h1 className="title">
          Suas finanças,
          <span>organizadas de verdade.</span>
        </h1>
        <p className="description">
          O ManusFinance reúne contas, cartões, investimentos e metas
          em uma única plataforma moderna. Tome decisões com clareza —
          sem planilhas, sem complicação.
        </p>
        <div className="buttons">
          <button className="primary-btn" onClick={() => navigate("/login")}>
            Começar agora
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section className="section" id="funcionalidades">
        <div className="section-header">
          <p className="section-tag">Funcionalidades</p>
          <h2 className="section-title">Tudo que você precisa para controlar o seu dinheiro</h2>
          <p className="section-sub">Ferramentas pensadas para quem quer sair do vermelho, poupar mais e investir melhor.</p>
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

      {/* COMO FUNCIONA */}
      <section className="section" id="como-funciona">
        <div className="section-header">
          <p className="section-tag">Como funciona</p>
          <h2 className="section-title">Configure em menos de 3 minutos</h2>
          <p className="section-sub">Simples e direto — sem burocracia para começar.</p>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={i}>
              <div className="step-number">{String(i + 1).padStart(2, "0")}</div>
              <div className="step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOBRE */}
      <section className="section" id="sobre">
        <div className="section-header">
          <p className="section-tag">Sobre</p>
          <h2 className="section-title">O que é o ManusFinance?</h2>
          <p className="section-sub">
            Uma plataforma de gestão financeira pessoal desenvolvida por estudantes do SENAI,
            com o objetivo de tornar as finanças acessíveis e compreensíveis para todos.
          </p>
        </div>
        <div className="grid-3">
          {about.map((a, i) => (
            <div className="card" key={i}>
              <div className="card-icon">{a.icon}</div>
              <h3>{a.title}</h3>
              <p>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">
          <img src="/mflogo.jpeg" alt="ManusFinance" className="logo-image logo-sm" />
          <span>ManusFinance</span>
        </div>
        <p className="footer-copy">
          Projeto FeiraTech - SENAI &nbsp;·&nbsp; © {new Date().getFullYear()} ManusFinance
        </p>
      </footer>

    </div>
  )
}