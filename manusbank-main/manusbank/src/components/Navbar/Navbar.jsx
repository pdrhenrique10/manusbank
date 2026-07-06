// src/components/Navbar/Navbar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { API_URL } from "../../config/api";
import { SunMedium, MoonStar, Crown, LineChart } from "lucide-react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  const [nome, setNome] = useState("");
  const [plano, setPlano] = useState("gratis");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setNome(parsed.nome || "");
      } catch (e) {
        // ignora — não é crítico
      }
    }

    async function carregarPlano() {
      const token = localStorage.getItem("token");
      if (!token) {
        setCarregando(false);
        return;
      }

      try {
        const resp = await fetch(`${API_URL}/api/usuario/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) return;

        const dados = await resp.json();
        setPlano(dados.plano || "gratis");
        if (dados.nome) setNome(dados.nome);
      } catch (e) {
        console.error("Erro ao carregar plano na navbar:", e);
      } finally {
        setCarregando(false);
      }
    }

    carregarPlano();
  }, []);

  const avatarInitial = nome?.charAt(0)?.toUpperCase() || "?";

  return (
    <header className="navbar-system">
      <div className="navbar-logo" onClick={() => navigate("/dashboard")}>
        <div className="navbar-logo-icon">
         <img src="mflogo.jpeg" alt="Logo ManusFinance" style={{ width: "30px", height: "30px", borderRadius: "20%" }} />
        </div>
        <h2>ManusFinance</h2>
      </div>

      <div className="navbar-actions">
        <button
          className="navbar-theme-btn"
          onClick={toggleTheme}
          aria-label="Alternar modo claro/escuro"
          title={isDark ? "Modo escuro" : "Modo claro"}
        >
          {isDark ? <MoonStar size={18} /> : <SunMedium size={18} />}
        </button>

        <button
          className={`navbar-plan-badge ${plano === "premium" ? "navbar-plan-premium" : "navbar-plan-free"}`}
          onClick={() => navigate(plano === "premium" ? "/configuracoes" : "/trocar-plano")}
          title={plano === "premium" ? "Você é Premium" : "Fazer upgrade para Premium"}
        >
          <Crown size={14} />
          {carregando ? "..." : plano === "premium" ? "Premium" : "Grátis"}
        </button>

        <div className="navbar-user" onClick={() => navigate("/configuracoes")}>
          <div className="navbar-avatar">{avatarInitial}</div>
          <span className="navbar-user-name">{nome || "Usuário"}</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;