// pages/Home/Home.jsx

import "./Home.css"

import { useNavigate } from "react-router-dom"

import {
  ShieldCheck,
  BarChart3,
  Wallet,
} from "lucide-react"

export default function Home() {

  const navigate = useNavigate()

  return (

    <div className="home">

      {/* NAVBAR */}
      <header className="navbar">

        <div>

          <h1 className="logo">
            ManusFinance
          </h1>

          <p className="subtitle">
            Plataforma de gestão financeira pessoal
          </p>

        </div>

      </header>

      {/* HERO */}
      <section className="hero">

        {/* LEFT - agora centralizado */}
        <div className="hero-left">
          <h1 className="title">

            Organize seus

            <span>
              investimentos
            </span>

            e sua vida financeira

          </h1>

          <p className="description">

            Controle gastos, acompanhe receitas,
            visualize relatórios e tenha total
            domínio das suas finanças em uma
            plataforma moderna e intuitiva.

          </p>

          {/* BUTTONS */}
          <div className="buttons">

            <button
              className="primary-btn"
              onClick={() => navigate("/login")}
            >
              Começar agora
            </button>
          </div>

          {/* FEATURES */}
          <div className="features">

            {/* ITEM */}
            <div className="feature-card">

              <div className="feature-icon">
                <ShieldCheck size={28} />
              </div>

              <div>

                <h3>
                  Segurança
                </h3>

                <p>
                  Dados protegidos
                </p>

              </div>

            </div>

            {/* ITEM */}
            <div className="feature-card">

              <div className="feature-icon">
                <BarChart3 size={28} />
              </div>

              <div>

                <h3>
                  Relatórios
                </h3>

                <p>
                  Análises inteligentes
                </p>

              </div>

            </div>

            {/* ITEM */}
            <div className="feature-card">

              <div className="feature-icon">
                <Wallet size={28} />
              </div>

              <div>

                <h3>
                  Controle
                </h3>

                <p>
                  Gestão financeira
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  )
}