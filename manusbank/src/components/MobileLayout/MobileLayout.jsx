// src/components/MobileLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar/Sidebar.jsx";// Certifique-se que o caminho está certo
import "./MobileLayout.css";

function MobileLayout() {
  const [menuAberto, setMenuAberto] = useState(false);

  const handleLinkClick = () => {
    setMenuAberto(false);
  };

  return (
    <div className="app-container">
      
      {/* --- NAVBAR DO CELULAR (Só aparece em telas pequenas) --- */}
      <header className="mobile-navbar">
        <div className="mobile-navbar-left">
          <div className="mobile-logo">
            {/* Logo da pasta public */}
            <img src="/mflogo.jpeg" alt="Logo ManusFinance" className="mobile-logo-img" />
            <h2>ManusFinance</h2>
          </div>
        </div>
        <button 
          className="mobile-hamburger" 
          onClick={() => setMenuAberto(!menuAberto)}
        >
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </button>
      </header>

      {/* --- SIDEBAR E OVERLAY (Desktop esquerda / Celular Drawer) --- */}
      <div className={`sidebar-container ${menuAberto ? 'sidebar-ativa' : ''}`}>
        <div className="sidebar-overlay" onClick={() => setMenuAberto(false)}></div>

        <aside className="sidebar">
          {/* Cabeçalho da sidebar (só aparece no celular) */}
          <div className="sidebar-header-mobile">
            <div className="mobile-logo">
              <img src="/mflogo.jpeg" alt="Logo ManusFinance" className="mobile-logo-img" />
              <h2>ManusFinance</h2>
            </div>
            <button className="mobile-close-btn" onClick={() => setMenuAberto(false)}>
              ✕
            </button>
          </div>

          {/* Seu componente Sidebar original */}
          <Sidebar closeMenu={handleLinkClick} />
        </aside>
      </div>

      {/* --- CONTEÚDO DA PÁGINA (Gráficos, formulários) --- */}
      <main className="main-content">
        <Outlet />
      </main>

    </div>
  );
}

export default MobileLayout;