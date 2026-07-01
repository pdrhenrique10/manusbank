import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useTheme } from "../../hooks/useTheme";
import { useCurrency } from "../../context/CurrencyProvider"; // 🔥 Importe o hook da moeda
import "./Configuracoes.css";
import {
  LogOut,
  SunMedium,
  MoonStar,
  User,
  Mail,
  LogIn,
  ShieldCheck,
  AlertTriangle,
  X,
  Settings,
  Palette,
  Wallet, // 🔥 Ícone da moeda
} from "lucide-react";

function Configuracoes() {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const { currency, setCurrency } = useCurrency(); // 🔥 Use o hook da moeda

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Erro ao parsear user:", e);
        setUser(null);
      }
    } else {
      setUser({
        name: "",
        email: "Usuário autenticado",
      });
    }

    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const confirmLogout = () => {
    setShowModal(false);
    handleLogout();
  };

  const cancelLogout = () => {
    setShowModal(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="config-main">Carregando...</main>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="config-main">
          Não foi possível carregar os dados do usuário.
        </main>
      </div>
    );
  }

  const avatarInitial =
    user.name?.charAt(0)?.toUpperCase() ||
    user.email?.charAt(0)?.toUpperCase() ||
    "?";

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      <Sidebar />

      <main className="config-main">
        <div className="config-container">
          <header className="config-header">
            <h1>Configurações</h1>
            <p className="config-subtitle">
              Ajuste preferências da sua conta e do sistema.
            </p>
          </header>

          {/* Conta */}
          <section className="config-section">
            <h2>
              <ShieldCheck size={18} />
              Conta
            </h2>

            <div className="config-avatar-row">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt="Foto"
                  className="config-avatar-img"
                />
              ) : (
                <div className="config-avatar">{avatarInitial}</div>
              )}
            </div>

            <div className="config-row">
              <div className="config-text">
                <User size={16} className="config-icon" /> Nome:
              </div>
              <span className="config-value">
                {user.nome || "Não informado"}
              </span>
            </div>

            <div className="config-row">
              <div className="config-text">
                <Mail size={16} className="config-icon" /> Email:
              </div>
              <span className="config-value">
                {user.email || "Não informado"}
              </span>
            </div>

            <div className="config-row">
              <div className="config-text">
                <LogIn size={16} className="config-icon" /> Tipo de login:
              </div>
              <span className="config-value">Email/Senha</span>
            </div>

            <div className="config-row">
              <div className="config-text">
                <LogOut size={16} className="config-icon" /> Sair da conta:
              </div>
              <button
                className="config-btn-danger"
                onClick={() => setShowModal(true)}
              >
                <LogOut size={18} /> Sair
              </button>
            </div>
          </section>

          {/* Tema */}
          <section className="config-section">
            <h2>
              <Palette size={18} />
              Aparência
            </h2>
            
            <div className="config-row">
              <div className="config-text">
                <Settings size={16} className="config-icon" /> Tema:
              </div>
              <div className="theme-toggle-wrapper">
                <button 
                  className="theme-toggle-btn" 
                  onClick={toggleTheme}
                  aria-label="Alternar tema"
                >
                  {isDark ? (
                    <>
                      <MoonStar size={18} /> 
                      <span>Escuro</span>
                    </>
                  ) : (
                    <>
                      <SunMedium size={18} /> 
                      <span>Claro</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* 🔥 NOVA SEÇÃO: MOEDA */}
          <section className="config-section">
            <h2>
              <Wallet size={18} />
              Moeda
            </h2>
            
            <div className="config-row">
              <div className="config-text">
                <Settings size={16} className="config-icon" /> Moeda padrão:
              </div>
              <div className="theme-toggle-wrapper">
                <select 
                  className="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="BRL">Real (R$)</option>
                  <option value="USD">Dólar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">Libra (£)</option>
                </select>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* MODAL DE CONFIRMAÇÃO MODERNO */}
      {showModal && (
        <div className="logout-modal-overlay" onClick={cancelLogout}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cancelLogout}>
              <X size={20} />
            </button>
            
            <div className="modal-icon-wrapper">
              <AlertTriangle size={40} className="modal-alert-icon" />
            </div>
            
            <h3 className="modal-title">Sair da conta</h3>
            <p className="modal-description">
              Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o sistema.
            </p>
            
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={cancelLogout}>
                Cancelar
              </button>
              <button className="modal-btn-confirm" onClick={confirmLogout}>
                <LogOut size={18} /> Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Configuracoes;