import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useTheme } from "../../hooks/useTheme";
import { useCurrency } from "../../context/CurrencyProvider";
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
  Wallet,
  Languages,
  Crown,
  Lock,
} from "lucide-react";

function Configuracoes() {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { idioma, mudarIdioma, traduzindo, t } = useIdioma();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // 👇 plano vem do backend — é ele quem decide de verdade se a
  // troca de moeda é permitida (o front nunca deve confiar só em si mesmo).
  const [plano, setPlano] = useState("gratis");
  const [carregandoPlano, setCarregandoPlano] = useState(true);
  const [trocandoMoeda, setTrocandoMoeda] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [moedaPendente, setMoedaPendente] = useState(null);
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

    // 👇 busca o plano e a moeda REAIS do backend. Antes, o seletor de
    // moeda só olhava pro estado local do CurrencyProvider (localStorage),
    // que podia estar completamente fora de sincronia com o que o
    // backend tinha registrado — inclusive permitindo que uma conta
    // grátis "trocasse" de moeda só na aparência, sem o backend nunca
    // saber disso.
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

        // moeda "de verdade": pra conta grátis é a moeda fixa; pra
        // premium é a moeda atual escolhida. Sincroniza o contexto
        // global (CurrencyProvider) com essa verdade, se estiver diferente.
        const moedaReal =
          dados.plano === "gratis"
            ? dados.moedaFixa || dados.moedaAtual || "BRL"
            : dados.moedaAtual || "BRL";

        if (moedaReal && moedaReal !== currency) {
          setCurrency(moedaReal);
        }
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

  // Persiste a moeda no backend e só então atualiza o contexto global —
  // nunca o contrário, pra não deixar o front "achar" que mudou quando
  // o backend recusou.
  async function persistirMoeda(novaMoeda) {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setTrocandoMoeda(true);
    setErro("");
    setSucesso("");

    try {
      const resp = await fetch(`${API_URL}/api/usuario/moeda`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ moeda: novaMoeda }),
      });

      const dados = await resp.json();

      if (!resp.ok) {
        // 403 = backend também bloqueou (plano grátis) — fallback de
        // segurança caso o estado de "plano" no front esteja atrasado.
        if (resp.status === 403) {
          setPlano("gratis");
          setMoedaPendente(novaMoeda);
          setShowUpgradeModal(true);
          return;
        }
        setErro(dados.erro || t("configuracoes.errorCurrency"));
        return;
      }

      setCurrency(novaMoeda);

      // mantém o localStorage("user") coerente, já que outras telas
      // podem ler moedaAtual de lá.
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem(
            "user",
            JSON.stringify({ ...parsed, moedaAtual: dados.moedaAtual })
          );
        } catch (e) {
          // ignora — não é crítico
        }
      }

      setSucesso(t("configuracoes.currencyUpdated"));
    } catch (e) {
      console.error("Erro ao trocar moeda:", e);
      setErro(t("configuracoes.errorCurrency"));
    } finally {
      setTrocandoMoeda(false);
    }
  }

  // Handler do <select> de moeda — decide bloquear ou trocar de verdade.
  const handleCurrencyChange = (e) => {
    const novaMoeda = e.target.value;
    if (novaMoeda === currency) return;

    if (plano === "gratis") {
      // não troca nada — o <select> continua controlado por "currency",
      // então ele automaticamente volta a mostrar o valor antigo.
      setMoedaPendente(novaMoeda);
      setShowUpgradeModal(true);
      return;
    }

    persistirMoeda(novaMoeda);
  };

  const fecharUpgradeModal = () => {
    setShowUpgradeModal(false);
    setMoedaPendente(null);
  };

  // Não assina mais aqui — só leva pra tela dedicada de troca de plano,
  // onde a assinatura de fato acontece (com opção real de cancelar,
  // que volta pra Configurações sem persistir nada).
  const handleIrParaPlanos = () => {
    setShowUpgradeModal(false);
    navigate("/trocar-plano", { state: { moedaPendente } });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="config-main">{t("geral.loading")}</main>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="config-main">
          {t("configuracoes.userNotFound")}
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

          {/* Configurações Gerais (Aparência, Idioma e Moeda unificadas) */}
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

            {/* Moeda */}
            <div className="config-subsection">
              <div className="config-row">
                <div className="config-text">
                  <Wallet size={16} className="config-icon" /> {t("configuracoes.defaultCurrency")}:
                  {plano === "gratis" && !carregandoPlano && (
                    <Lock size={13} className="config-lock-icon" title={t("configuracoes.currencyLocked")} />
                  )}
                </div>
                <div className="theme-toggle-wrapper">
                  <select
                    className="currency-select"
                    value={currency}
                    onChange={handleCurrencyChange}
                    disabled={carregandoPlano || trocandoMoeda}
                    style={{ opacity: trocandoMoeda ? 0.6 : 1 }}
                  >
                    <option value="BRL">{t("configuracoes.real")}</option>
                    <option value="USD">{t("configuracoes.dollar")}</option>
                    <option value="EUR">{t("configuracoes.euro")}</option>
                    <option value="GBP">{t("configuracoes.pound")}</option>
                  </select>
                </div>
              </div>
              {plano === "gratis" && !carregandoPlano && (
                <p className="config-hint">
                  {t("configuracoes.currencyLockedHint")}
                </p>
              )}
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

      {/* Modal de upgrade de plano */}
      {showUpgradeModal && (
        <div className="premium-modal-overlay" onClick={fecharUpgradeModal}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <button className="premium-modal-close-btn" onClick={fecharUpgradeModal} aria-label="Fechar">
              <X size={18} />
            </button>
            <div className="premium-modal-icon-wrapper premium-glow">
              <Crown size={36} className="premium-modal-icon" />
            </div>
            <h3 className="premium-modal-title">{t("configuracoes.upgradeModalTitle")}</h3>
            <p className="premium-modal-description">
              {t("configuracoes.upgradeModalDescription")}
            </p>
            {erro && <p className="erro-msg">{erro}</p>}
            <div className="premium-modal-actions">
              <button className="premium-modal-btn-cancel" onClick={fecharUpgradeModal}>
                {t("geral.cancel")}
              </button>
              <button
                className="premium-modal-btn-confirm"
                onClick={handleIrParaPlanos}
              >
                <Crown size={16} />
                {t("configuracoes.upgradeButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Configuracoes;