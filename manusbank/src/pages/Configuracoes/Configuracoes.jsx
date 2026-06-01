import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Configuracoes.css";
import { LogOut, SunMedium, MoonStar, User } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

function Configuracoes() {
  const { isDark, toggleTheme } = useTheme();
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const resp = await fetch("http://localhost:3000/api/dashboard");
        
        if (!resp.ok) {
          window.location.href = "/login";
          return;
        }

        const dados = await resp.json();
        setUsuario(dados.usuario);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarUsuario();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    
    fetch("http://localhost:3000/api/logout", {
      method: "POST",
    }).finally(() => {
      window.location.href = "/login";
    });
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <main className="config-main">
        <div className="config-container">
          <header className="config-header">
            <h1>Configurações</h1>
            <p className="config-subtitle">
              Ajuste preferências da sua conta e do aplicativo
            </p>
          </header>

          <section className="config-section">
            <h2>Conta</h2>

            <div className="config-row">
              <div className="config-text">
                <span className="config-label">
                  <User size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
                  Usuário:
                </span>
                <span className="config-description" style={{ fontWeight: "600", fontSize: "1rem", color: "var(--text-primary)" }}>
                  {carregando ? "Carregando..." : usuario?.nome || "Usuário não encontrado"}
                </span>
              </div>
            </div>

            <div className="config-row">
              <div className="config-text">
                <span className="config-label">Sair da conta:</span>
                <span className="config-description">
                  Encerre a sessão neste dispositivo
                </span>
              </div>
              <button className="config-btn-danger" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Sair</span>
              </button>
            </div>
          </section>

          <section className="config-section">
            <h2>Aparência</h2>

            <div className="config-row">
              <div className="config-text">
                <span className="config-label">Modo de exibição</span>
                <span className="config-description">
                  Alternar entre modo claro e escuro
                </span>
              </div>

              <button
                className="config-btn-toggle"
                onClick={toggleTheme}
                type="button"
              >
                {isDark ? <MoonStar size={18} /> : <SunMedium size={18} />}
                <span>{isDark ? "Modo escuro" : "Modo claro"}</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Configuracoes;