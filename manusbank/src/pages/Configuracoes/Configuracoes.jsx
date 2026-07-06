import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { useIdioma } from "../../context/IdiomaContext";
import { API_URL } from "../../config/api";
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
  Languages,
  Crown,
} from "lucide-react";

function Configuracoes() {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const { idioma, mudarIdioma, traduzindo, t } = useIdioma();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Plano exibido como informação — não há mais nenhuma ação de troca
  // de moeda vinculada a ele. A moeda da conta é definida no cadastro
  // e não muda depois, em nenhum plano.
  const [plano, setPlano] = useState("gratis");
  const [carregandoPlano, setCarregandoPlano] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

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
        email: t("configuracoes.authenticatedUser"),
      });
    }
    setLoading(false);

    async function carregarPlano() {
      try {
        setCarregandoPlano(true);
        const resp = await fetch(`${API_URL}/api/usuario/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resp.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!resp.ok) return;

        const dados = await resp.json();
        setPlano(dados.plano || "gratis");
      } catch (e) {
        console.error("Erro ao carregar plano do usuário:", e);
      } finally {
        setCarregandoPlano(false);
      }
    }

    carregarPlano();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, t]);

  useEffect(() => {
    if (sucesso) {
      const timer = setTimeout(() => setSucesso(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [sucesso]);

  useEffect(() => {
    if (erro) {
      const timer = setTimeout(() => setErro(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [erro]);

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

  // 👇 guardas restauradas: sem isso, "user.name" abaixo quebra
  // enquanto o fetch ainda não terminou (user começa como null).
  if (loading) {
    return <main className="config-main">{t("geral.loading")}</main>;
  }

  if (!user) {
    return (
      <main className="config-main">
        {t("configuracoes.userNotFound")}
      </main>
    );
  }

  const avatarInitial =
    user.name?.charAt(0)?.toUpperCase() ||
    user.email?.charAt(0)?.toUpperCase() ||
    "?";

  return (
    <>
      <main className="config-main">
        <div className="config-container">
          <header className="config-header">
            <h1>{t("configuracoes.title")}</h1>
            <p className="config-subtitle">
              {t("configuracoes.subtitle")}
            </p>
          </header>

          {erro && <p className="erro-msg">{erro}</p>}
          {sucesso && <p className="sucesso-msg">{sucesso}</p>}

          {/* Conta */}
          <section className="config-section">
            <h2>
              <ShieldCheck size={18} />
              {t("configuracoes.account")}
            </h2>
            <div className="config-avatar-row">
              {user.photo ? (
                <img src={user.photo} alt="Avatar" className="config-avatar-img" />
              ) : (
                <div className="config-avatar">{avatarInitial}</div>
              )}
            </div>
            <div className="config-row">
              <div className="config-text">
                <User size={16} className="config-icon" /> {t("configuracoes.name")}:
              </div>
              <span className="config-value">
                {user.nome || t("configuracoes.notInformed")}
              </span>
            </div>
            <div className="config-row">
              <div className="config-text">
                <Mail size={16} className="config-icon" /> {t("configuracoes.email")}:
              </div>
              <span className="config-value">
                {user.email || t("configuracoes.notInformed")}
              </span>
            </div>
            <div className="config-row">
              <div className="config-text">
                <LogIn size={16} className="config-icon" /> {t("configuracoes.loginType")}:
              </div>
              <span className="config-value">{t("configuracoes.emailPassword")}</span>
            </div>
            <div className="config-row">
              <div className="config-text">
                <Crown size={16} className="config-icon" /> {t("configuracoes.plan")}:
              </div>
              <span className="config-value">
                {carregandoPlano
                  ? t("geral.loading")
                  : plano === "premium"
                  ? t("configuracoes.planPremium")
                  : t("configuracoes.planFree")}
              </span>
            </div>
            <div className="config-row">
              <div className="config-text">
                <LogOut size={16} className="config-icon" /> {t("configuracoes.logout")}:
              </div>
              <button
                className="config-btn-danger"
                onClick={() => setShowModal(true)}
              >
                <LogOut size={18} /> {t("configuracoes.logoutButton")}
              </button>
            </div>
          </section>

          {/* Configurações Gerais (Aparência e Idioma) */}
          <section className="config-section">
            <h2>
              <Settings size={18} />
              {t("configuracoes.generalSettings")}
            </h2>

            {/* Tema */}
            <div className="config-subsection">
              <div className="config-row">
                <div className="config-text">
                  <Palette size={16} className="config-icon" /> {t("configuracoes.theme")}:
                </div>
                <div className="theme-toggle-wrapper">
                  <button
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                    aria-label={t("configuracoes.toggleTheme")}
                  >
                    {isDark ? (
                      <>
                        <MoonStar size={18} />
                        <span>{t("configuracoes.dark")}</span>
                      </>
                    ) : (
                      <>
                        <SunMedium size={18} />
                        <span>{t("configuracoes.light")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Idioma */}
            <div className="config-subsection">
              <div className="config-row">
                <div className="config-text">
                  <Languages size={16} className="config-icon" /> {t("configuracoes.interfaceLanguage")}:
                </div>
                <div className="theme-toggle-wrapper">
                  <select
                    className="currency-select"
                    value={idioma}
                    onChange={(e) => mudarIdioma(e.target.value)}
                    disabled={traduzindo}
                    style={{ opacity: traduzindo ? 0.6 : 1 }}
                  >
                    <option value="pt-BR">{t("configuracoes.portuguese")}</option>
                    <option value="en">{t("configuracoes.english")}</option>
                    <option value="es">{t("configuracoes.spanish")}</option>
                    <option value="fr">{t("configuracoes.french")}</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Modal de logout */}
      {showModal && (
        <div className="logout-modal-overlay" onClick={cancelLogout}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cancelLogout} aria-label="Fechar">
              <X size={18} />
            </button>
            <div className="modal-icon-wrapper danger-glow">
              <AlertTriangle size={36} className="modal-alert-icon" />
            </div>
            <h3 className="modal-title">{t("configuracoes.modalTitle")}</h3>
            <p className="modal-description">
              {t("configuracoes.modalDescription")}
            </p>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={cancelLogout}>
                {t("geral.cancel")}
              </button>
              <button className="modal-btn-confirm" onClick={confirmLogout}>
                <LogOut size={16} /> {t("configuracoes.logoutButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Configuracoes;