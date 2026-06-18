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
  ShieldCheck,
  AlertTriangle,
  X,
  Settings,
  Palette,
} from "lucide-react";

function Configuracoes() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [logoutTimer, setLogoutTimer] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Se não tiver token, manda pro login
    if (!token) {
      navigate("/login");
      return;
    }

    // Se mais tarde você quiser salvar user no localStorage,
    // pode reaproveitar aqui. Por enquanto, cria um placeholder simples.
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Erro ao parsear user:", e);
        setUser(null);
      }
    } else {
      // fallback: usa só email como "desconhecido" ou deixa null
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

  const showLogoutWarning = () => {
    setShowToast(true);

    const timer = setTimeout(() => {
      setShowToast(false);
    }, 5000);

    setLogoutTimer(timer);
  };

  const confirmLogout = () => {
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
                {user.name || "Não informado"}
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
                onClick={showLogoutWarning}
              >
                <LogOut size={18} /> Sair
              </button>
            </div>
          </section>
        </div>
      </main>

      {showToast && (
        <div className="toast-warning">
          <div className="toast-content">
            <AlertTriangle size={20} className="toast-icon" />
            <div className="toast-message">
              <strong>Atenção!</strong> Você tem certeza que deseja sair da
              conta? Você precisará fazer login novamente para acessar o
              sistema.
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