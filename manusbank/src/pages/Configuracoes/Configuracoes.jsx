import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Configuracoes.css";
import {
  LogOut,
  SunMedium,
  MoonStar,
  User,
  Mail,
  LogIn,
  Settings,
  Palette,
  ShieldCheck,
  AlertTriangle,
  X,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

function Configuracoes() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [logoutTimer, setLogoutTimer] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      navigate("/login");
      return;
    }
    try {
      setUser(JSON.parse(userData));
    } catch (e) {
      console.error(e);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const showLogoutWarning = () => {
    setShowToast(true);
    
    // Timer para esconder o toast após 5 segundos
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 5000);
    
    setLogoutTimer(timer);
  };

  const confirmLogout = () => {
    // Limpa o timer do toast se existir
    if (logoutTimer) {
      clearTimeout(logoutTimer);
    }
    setShowToast(false);
    handleLogout();
  };

  const cancelLogout = () => {
    setShowToast(false);
    if (logoutTimer) {
      clearTimeout(logoutTimer);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="config-main">Carregando...</main>
      </div>
    );
  }

  if (!user) return null;

  const avatarInitial =
    user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      <Sidebar />
      <main className="config-main">
        <div className="config-container">
          {/* Título da página com ícone */}
          <header className="config-header">
            <h1>Configurações</h1>
            <p className="config-subtitle">Ajuste preferências da sua conta e do sistema.</p>
          </header>

          {/* Seção Conta */}
          <section className="config-section">
            <h2>
              <ShieldCheck size={18} />
              Conta
            </h2>

            <div className="config-avatar-row">
              {user.photo ? (
                <img src={user.photo} alt="Foto" className="config-avatar-img" />
              ) : (
                <div className="config-avatar">{avatarInitial}</div>
              )}
            </div>

            <div className="config-row">
              <div className="config-text">
                <User size={16} className="config-icon" /> Nome:
              </div>
              <span className="config-value">{user.name || "Não informado"}</span>
            </div>

            <div className="config-row">
              <div className="config-text">
                <Mail size={16} className="config-icon" /> Email:
              </div>
              <span className="config-value">{user.email}</span>
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
              <button className="config-btn-danger" onClick={showLogoutWarning}>
                <LogOut size={18} /> Sair
              </button>
            </div>
          </section>

          {/* Seção Aparência */}
          <section className="config-section">
            <h2>
              <Palette size={18} />
              Aparência
            </h2>
            <div className="config-row">
              <div className="config-text">
                {isDark ? (
                  <MoonStar size={16} className="config-icon" />
                ) : (
                  <SunMedium size={16} className="config-icon" />
                )}
                Modo de exibição
              </div>
              <button className="config-btn-toggle" onClick={toggleTheme}>
                {isDark ? <MoonStar size={18} /> : <SunMedium size={18} />}
                <span>{isDark ? "Modo escuro" : "Modo claro"}</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Toast de aviso no topo */}
      {showToast && (
        <div className="toast-warning">
          <div className="toast-content">
            <AlertTriangle size={20} className="toast-icon" />
            <div className="toast-message">
              <strong>Atenção!</strong> Você tem certeza que deseja sair da conta? 
              Você precisará fazer login novamente para acessar o sistema.
            </div>
          </div>
          <div className="toast-actions">
            <button className="toast-btn-cancel" onClick={cancelLogout}>
              Cancelar
            </button>
            <button className="toast-btn-confirm" onClick={confirmLogout}>
              Confirmar
            </button>
          </div>
          <button className="toast-close" onClick={cancelLogout}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default Configuracoes;