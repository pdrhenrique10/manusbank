import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./MetasFinanceiras.css";
import { Plus, X, CalendarClock, TrendingUp, Trash2, Pencil } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_URL } from "../../config/api";
import { useIdioma } from "../../context/IdiomaContext";
import { useCurrency } from "../../context/CurrencyProvider";

// Componente auxiliar para exibir valor já convertido
function Money({ value }) {
  const { formatMoney } = useCurrency();
  return <span>{formatMoney(value)}</span>;
}

function MetasFinanceiras() {
  const navigate = useNavigate();
  const { t } = useIdioma();
  const { formatMoney, currency, rates } = useCurrency();

  const [modalAberto, setModalAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [metas, setMetas] = useState([]);
  const [novaMeta, setNovaMeta] = useState({
    titulo: "",
    valorAlvo: "",
    dataMeta: "",
    descricao: "",
  });
  const [metaEditando, setMetaEditando] = useState(null);
  const [valorAporte, setValorAporte] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);

  const moedaAnteriorRef = useRef(currency);

  // 👇 Funções de conversão
  const convertToBRL = (value, fromCurrency) => {
    if (!fromCurrency || fromCurrency === "BRL") return value;
    const rate = rates[fromCurrency] || 1;
    return value * rate;
  };

  const convertFromBRL = (valueInBRL) => {
    if (!currency || currency === "BRL") return valueInBRL;
    const rate = rates[currency] || 1;
    return valueInBRL / rate;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    carregarMetas(token);
  }, [navigate]);

  // 👇 Efeito para recarregar e converter metas apenas quando a moeda muda
  useEffect(() => {
    if (moedaAnteriorRef.current !== currency && metas.length > 0) {
      moedaAnteriorRef.current = currency;

      const metasConvertidas = metas.map(meta => {
        // 🛑 CORREÇÃO: se o backend não devolveu "moeda" (campo ausente),
        // NÃO assumimos mais "BRL" às cegas — isso causava conversões erradas
        // para quem usa o app em outra moeda (ex: USD) desde o início.
        // Se não sabemos a moeda real do registro, assumimos que ele já
        // está na moeda atualmente exibida (não força conversão indevida).
        const metaMoeda = meta.moeda || currency;

        if (metaMoeda !== currency) {
          const valorAlvoEmBRL = convertToBRL(Number(meta.valorAlvo) || 0, metaMoeda);
          const valorAtualEmBRL = convertToBRL(Number(meta.valorAtual) || 0, metaMoeda);
          
          return {
            ...meta,
            valorAlvo: convertFromBRL(valorAlvoEmBRL),
            valorAtual: convertFromBRL(valorAtualEmBRL),
            moeda: currency,
          };
        }
        return meta;
      });
      
      setMetas(metasConvertidas);
    }
  }, [currency, metas, rates]);

  async function carregarMetas(token) {
    try {
      setCarregando(true);
      setErro("");
      setSucesso("");

      const resp = await fetch(`${API_URL}/api/metas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!resp.ok) {
        const metasLocal = JSON.parse(localStorage.getItem("metasFinanceiras") || "[]");
        setMetas(metasLocal);
        setCarregando(false);
        return;
      }

      const dados = await resp.json();
      
      const metasConvertidas = (dados || []).map(meta => {
        // 🛑 CORREÇÃO: mesmo motivo do efeito acima — não assumir "BRL"
        // quando o registro vindo da API não tem "moeda" definida.
        const metaMoeda = meta.moeda || currency;
        if (metaMoeda !== currency) {
          const valorAlvoEmBRL = convertToBRL(Number(meta.valorAlvo) || 0, metaMoeda);
          const valorAtualEmBRL = convertToBRL(Number(meta.valorAtual) || 0, metaMoeda);
          
          return {
            ...meta,
            valorAlvo: convertFromBRL(valorAlvoEmBRL),
            valorAtual: convertFromBRL(valorAtualEmBRL),
            moeda: currency,
          };
        }
        return meta;
      });
      
      setMetas(metasConvertidas);
      localStorage.setItem("metasFinanceiras", JSON.stringify(metasConvertidas));
    } catch (e) {
      console.error("Erro ao carregar metas:", e);
      const metasLocal = JSON.parse(localStorage.getItem("metasFinanceiras") || "[]");
      setMetas(metasLocal);
      setErro(t("metasFinanceiras.errorLoading"));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (sucesso) {
      const timer = setTimeout(() => setSucesso(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [sucesso]);

  const dadosGrafico = metas.map((m) => {
    const objetivo = Number(m.valorAlvo) || 0;
    const atual = Number(m.valorAtual) || 0;
    const progresso = objetivo > 0 ? Math.min(100, (atual / objetivo) * 100) : 0;
    const falta = 100 - progresso;
    return {
      nome: m.titulo.length > 15 ? m.titulo.substring(0, 15) + "..." : m.titulo,
      progresso,
      falta,
    };
  });

  const metasConcluidas = metas.filter((m) => {
    const objetivo = Number(m.valorAlvo) || 0;
    const atual = Number(m.valorAtual) || 0;
    return objetivo > 0 && atual >= objetivo;
  }).length;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaMeta((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdicaoChange = (e) => {
    const { name, value } = e.target;
    setMetaEditando((prev) => ({ ...prev, [name]: value }));
  };

  const fecharModalEdicao = () => {
    setModalEdicaoAberto(false);
    setMetaEditando(null);
    setErro("");
  };

  const abrirModalEdicao = (meta) => {
    setMetaEditando({
      id: meta.id,
      titulo: meta.titulo,
      valorAlvo: meta.valorAlvo,
      dataMeta: String(meta.dataMeta || "").substring(0, 10),
      descricao: meta.descricao || "",
    });
    setModalEdicaoAberto(true);
  };

  const handleEditarMeta = async (e) => {
    e.preventDefault();
    if (!metaEditando) return;

    setErro("");
    setSucesso("");

    if (!metaEditando.titulo || !metaEditando.valorAlvo || !metaEditando.dataMeta) {
      setErro(t("metasFinanceiras.errorAllFields"));
      return;
    }

    const valorNumero = parseFloat(String(metaEditando.valorAlvo).replace(",", "."));
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErro(t("metasFinanceiras.errorInvalidValue"));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/metas/${metaEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: metaEditando.titulo,
          valorAlvo: valorNumero,
          dataMeta: metaEditando.dataMeta,
          descricao: metaEditando.descricao,
          moeda: currency,
        }),
      });

      const resultado = await resp.json();

      if (!resp.ok || !resultado.sucesso) {
        setErro(resultado.erro || t("metasFinanceiras.errorUpdating"));
        return;
      }

      const metasAtualizadas = metas.map((m) =>
        m.id === resultado.meta.id ? { ...resultado.meta, moeda: currency } : m
      );
      setMetas(metasAtualizadas);
      localStorage.setItem("metasFinanceiras", JSON.stringify(metasAtualizadas));
      setSucesso(t("metasFinanceiras.updatedSuccess"));
      fecharModalEdicao();
    } catch (err) {
      console.error("Erro ao editar meta:", err);
      setErro(t("metasFinanceiras.errorUpdating"));
    }
  };

  const handleAdicionarMeta = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!novaMeta.titulo || !novaMeta.valorAlvo || !novaMeta.dataMeta) {
      setErro(t("metasFinanceiras.errorAllFields"));
      return;
    }

    const valorNumero = parseFloat(String(novaMeta.valorAlvo).replace(",", "."));
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErro(t("metasFinanceiras.errorInvalidValue"));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const novaMetaObj = {
      id: Date.now(),
      titulo: novaMeta.titulo,
      valorAlvo: valorNumero,
      valorAtual: 0,
      dataMeta: novaMeta.dataMeta,
      descricao: novaMeta.descricao,
      moeda: currency,
    };

    try {
      const body = {
        titulo: novaMeta.titulo,
        valorAlvo: valorNumero,
        dataMeta: novaMeta.dataMeta,
        descricao: novaMeta.descricao,
        moeda: currency,
      };

      const resp = await fetch(`${API_URL}/api/metas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      // Fallback offline
      if (!resp.ok) {
        setMetas((prev) => [...prev, novaMetaObj]);
        localStorage.setItem("metasFinanceiras", JSON.stringify([...metas, novaMetaObj]));
        setSucesso(t("metasFinanceiras.savedLocally"));
        setModalAberto(false);
        setNovaMeta({ titulo: "", valorAlvo: "", dataMeta: "", descricao: "" });
        return;
      }

      const criada = await resp.json();
      const metaComMoeda = { ...criada, moeda: currency };
      setMetas((prev) => [...prev, metaComMoeda]);
      localStorage.setItem("metasFinanceiras", JSON.stringify([...metas, metaComMoeda]));
      setNovaMeta({ titulo: "", valorAlvo: "", dataMeta: "", descricao: "" });
      setModalAberto(false);
      setSucesso(t("metasFinanceiras.savedSuccess"));
    } catch (e) {
      console.error("Erro ao salvar meta:", e);
      setMetas((prev) => [...prev, novaMetaObj]);
      localStorage.setItem("metasFinanceiras", JSON.stringify([...metas, novaMetaObj]));
      setSucesso(t("metasFinanceiras.savedOffline"));
      setModalAberto(false);
      setNovaMeta({ titulo: "", valorAlvo: "", dataMeta: "", descricao: "" });
    }
  };

  const handleAportar = async (metaId) => {
    if (!valorAporte) {
      setErro(t("metasFinanceiras.errorAporteEmpty"));
      return;
    }

    const valorNumero = parseFloat(String(valorAporte).replace(",", "."));
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErro(t("metasFinanceiras.errorInvalidValue"));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/metas/${metaId}/aportar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          valor: valorNumero,
          moeda: currency,
        }),
      });

      if (!resp.ok) {
        setMetas((prev) =>
          prev.map((m) =>
            m.id === metaId ? { ...m, valorAtual: (m.valorAtual || 0) + valorNumero } : m
          )
        );
        localStorage.setItem("metasFinanceiras", JSON.stringify(metas.map((m) =>
          m.id === metaId ? { ...m, valorAtual: (m.valorAtual || 0) + valorNumero } : m
        )));
        setSucesso(t("metasFinanceiras.aporteSuccessLocal", { valor: formatMoney(valorNumero) }));
        setValorAporte("");
        return;
      }

      const { meta } = await resp.json();
      const metaComMoeda = { ...meta, moeda: currency };
      setMetas((prev) => prev.map((m) => (m.id === meta.id ? metaComMoeda : m)));
      localStorage.setItem("metasFinanceiras", JSON.stringify(metas.map((m) =>
        m.id === meta.id ? metaComMoeda : m
      )));
      setSucesso(t("metasFinanceiras.aporteSuccess", { valor: formatMoney(valorNumero) }));
      setValorAporte("");
    } catch (e) {
      console.error("Erro ao aportar na meta:", e);
      setErro(t("metasFinanceiras.errorAporte"));
    }
  };

  const handleTirarAporte = async (metaId) => {
    if (!valorAporte) {
      setErro(t("metasFinanceiras.errorDesaporteEmpty"));
      return;
    }

    const valorNumero = parseFloat(String(valorAporte).replace(",", "."));
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErro(t("metasFinanceiras.errorInvalidValue"));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/metas/${metaId}/desaportar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          valor: valorNumero,
          moeda: currency,
        }),
      });

      if (!resp.ok) {
        setMetas((prev) =>
          prev.map((m) =>
            m.id === metaId
              ? { ...m, valorAtual: Math.max(0, (m.valorAtual || 0) - valorNumero) }
              : m
          )
        );
        localStorage.setItem("metasFinanceiras", JSON.stringify(metas.map((m) =>
          m.id === metaId ? { ...m, valorAtual: Math.max(0, (m.valorAtual || 0) - valorNumero) } : m
        )));
        setSucesso(t("metasFinanceiras.desaporteSuccessLocal", { valor: formatMoney(valorNumero) }));
        setValorAporte("");
        return;
      }

      const { meta } = await resp.json();
      const metaComMoeda = { ...meta, moeda: currency };
      setMetas((prev) => prev.map((m) => (m.id === meta.id ? metaComMoeda : m)));
      localStorage.setItem("metasFinanceiras", JSON.stringify(metas.map((m) =>
        m.id === meta.id ? metaComMoeda : m
      )));
      setSucesso(t("metasFinanceiras.desaporteSuccess", { valor: formatMoney(valorNumero) }));
      setValorAporte("");
    } catch (e) {
      console.error("Erro ao tirar aporte da meta:", e);
      setErro(t("metasFinanceiras.errorDesaporte"));
    }
  };

  const handleRemoverMeta = async (id) => {
    const confirmar = window.confirm(t("metasFinanceiras.confirmDelete"));
    if (!confirmar) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/metas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = await resp.json();

      if (!resp.ok || !dados.sucesso) {
        setMetas((prev) => prev.filter((m) => m.id !== id));
        localStorage.setItem("metasFinanceiras", JSON.stringify(metas.filter((m) => m.id !== id)));
        setSucesso(t("metasFinanceiras.deletedLocally"));
        return;
      }

      setMetas((prev) => prev.filter((m) => m.id !== id));
      localStorage.setItem("metasFinanceiras", JSON.stringify(metas.filter((m) => m.id !== id)));
      setSucesso(t("metasFinanceiras.deletedSuccess"));
    } catch (e) {
      console.error("Erro ao remover meta:", e);
      setMetas((prev) => prev.filter((m) => m.id !== id));
      localStorage.setItem("metasFinanceiras", JSON.stringify(metas.filter((m) => m.id !== id)));
      setSucesso(t("metasFinanceiras.deletedLocally"));
    }
  };

  if (carregando) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "20px" }}>{t("geral.loading")}</main>
      </div>
    );
  }

  const modalAbertoOuEditando = modalAberto || modalEdicaoAberto;

  return (
    <div
      style={{ display: "flex", minHeight: "100vh" }}
      className={modalAbertoOuEditando ? "modo-modal" : ""}
    >
      <Sidebar />
      <main style={{ flex: 1, padding: "20px" }}>
        <div className="mf-container">
          <div className="mf-card">
            <header className="mf-header">
              <h1>{t("metasFinanceiras.title")}</h1>
              <p className="subtitle">{t("metasFinanceiras.subtitle")}</p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}
            {sucesso && <p className="sucesso-msg">{sucesso}</p>}

            <div className="mf-resumo-card">
              <div className="mf-resumo-item">
                <TrendingUp size={24} />
                <div>
                  <p className="mf-resumo-label">{t("metasFinanceiras.totalLabel")}</p>
                  <p className="mf-resumo-valor">{metas.length}</p>
                </div>
              </div>
              <div className="mf-resumo-item-secundario">
                <CalendarClock size={20} />
                <p className="mf-resumo-secundario-label">
                  {t("metasFinanceiras.completedLabel", { count: metasConcluidas })}
                </p>
              </div>
            </div>

            <button className="mf-btn-nova" onClick={() => setModalAberto(true)}>
              <Plus size={20} /> {t("metasFinanceiras.newButton")}
            </button>

            <section className="mf-grafico-section">
              <h2>{t("metasFinanceiras.chartTitle")}</h2>
              <div className="mf-grafico-container" style={{ width: '100%', height: '250px' }}>
                {carregando ? (
                  <div className="mf-grafico-vazio"><p>{t("metasFinanceiras.loadingChart")}</p></div>
                ) : metas.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="nome" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        labelStyle={{ color: "#f8fafc" }}
                        formatter={(value, name) => {
                          if (name === "progresso") return [`${Number(value).toFixed(1)}%`, t("metasFinanceiras.chartProgress")];
                          if (name === "falta") return [`${Number(value).toFixed(1)}%`, t("metasFinanceiras.chartRemaining")];
                          return [value, name];
                        }}
                        cursor={false}
                      />
                      <Bar dataKey="progresso" name={t("metasFinanceiras.chartProgress")} fill="#22c55e" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="falta" name={t("metasFinanceiras.chartRemaining")} fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="mf-grafico-vazio"><p>{t("metasFinanceiras.noDataChart")}</p></div>
                )}
              </div>
            </section>

            <section className="mf-lista">
              <h2>{t("metasFinanceiras.listTitle")}</h2>
              <div className="mf-lista-container">
                {carregando ? (
                  <div className="mf-lista-vazia"><p>{t("metasFinanceiras.loadingList")}</p></div>
                ) : metas.length > 0 ? (
                  metas.map((meta) => {
                    const objetivo = Number(meta.valorAlvo) || 0;
                    const atual = Number(meta.valorAtual) || 0;
                    const progresso = objetivo > 0 ? Math.min(100, (atual / objetivo) * 100) : 0;

                    let corBarra;
                    if (progresso >= 100) corBarra = "linear-gradient(90deg, #16a34a, #22c55e)";
                    else if (progresso >= 66) corBarra = "linear-gradient(90deg, #16a34a, #22c55e)";
                    else if (progresso >= 33) corBarra = "linear-gradient(90deg, #f59e0b, #f97316)";
                    else corBarra = "linear-gradient(90deg, #ef4444, #f97373)";

                    const hoje = new Date();
                    const dataMetaDate = meta.dataMeta ? new Date(meta.dataMeta + "T00:00:00") : null;
                    const hojeSoData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                    const metaAlcancada = progresso >= 100;
                    const metaAtrasada = !metaAlcancada && dataMetaDate && dataMetaDate < hojeSoData;

                    let statusLabel = "";
                    let statusClass = "meta-status";
                    if (metaAlcancada) {
                      statusLabel = t("metasFinanceiras.statusCompleted");
                      statusClass += " concluida";
                    } else if (metaAtrasada) {
                      statusLabel = t("metasFinanceiras.statusLate");
                      statusClass += " atrasada";
                    } else {
                      statusLabel = t("metasFinanceiras.statusInProgress");
                      statusClass += " em-progresso";
                    }

                    return (
                      <div key={meta.id} className="mf-item">
                        <div className="mf-info">
                          <h3>{meta.titulo}</h3>
                          <p className="mf-data">
                            {t("metasFinanceiras.targetDate")}:{" "}
                            {meta.dataMeta
                              ? new Date(meta.dataMeta + "T00:00:00").toLocaleDateString("pt-BR")
                              : "-"}
                          </p>
                          {meta.descricao && <p className="mf-descricao">{meta.descricao}</p>}
                          <p className="mf-valores">
                            <Money value={atual} /> {t("metasFinanceiras.of")} <Money value={objetivo} />
                          </p>
                          <div className="meta-progress">
                            <div
                              className="meta-progress-bar"
                              style={{ width: `${progresso}%`, background: corBarra }}
                            />
                          </div>
                          <p className={statusClass}>{statusLabel}</p>
                        </div>
                        <div className="mf-acoes">
                          <div className="mf-aporte-remover">
                            <input
                              type="number"
                              placeholder={t("metasFinanceiras.aportePlaceholder")}
                              className="mf-input-aporte"
                              value={valorAporte}
                              onChange={(e) => setValorAporte(e.target.value)}
                              min="0"
                              step="0.01"
                            />
                            <div className="mf-botoes-aporte">
                              <button className="mf-btn-aporte" onClick={() => handleAportar(meta.id)}>
                                {t("metasFinanceiras.aporteButton")}
                              </button>
                              <button className="mf-btn-tirar" onClick={() => handleTirarAporte(meta.id)}>
                                {t("metasFinanceiras.desaporteButton")}
                              </button>
                              <button className="mf-btn-editar" onClick={() => abrirModalEdicao(meta)} title={t("metasFinanceiras.editTitle")}>
                                <Pencil size={16} />
                              </button>
                              <button className="mf-btn-remover" onClick={() => handleRemoverMeta(meta.id)} title={t("metasFinanceiras.deleteTitle")}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="mf-lista-vazia"><p>{t("metasFinanceiras.noDataList")}</p></div>
                )}
              </div>
            </section>
          </div>

          {/* Modal de criação */}
          {modalAberto && (
            <div className="modal-overlay" onClick={() => setModalAberto(false)}>
              <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
                <button className="modal-fechar" onClick={() => setModalAberto(false)}><X size={24} /></button>
                <h2>{t("metasFinanceiras.modalCreate")}</h2>
                <form className="mf-form" onSubmit={handleAdicionarMeta}>
                  <div className="form-group">
                    <label htmlFor="titulo">{t("metasFinanceiras.formTitle")}</label>
                    <input type="text" id="titulo" name="titulo" placeholder={t("metasFinanceiras.formTitlePlaceholder")} autoComplete="off" value={novaMeta.titulo} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="valorAlvo">{t("metasFinanceiras.formTargetValue")}</label>
                    <input type="number" id="valorAlvo" name="valorAlvo" placeholder="0.00" step="0.01" min="0" autoComplete="off" value={novaMeta.valorAlvo} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="dataMeta">{t("metasFinanceiras.formTargetDate")}</label>
                    <input type="date" id="dataMeta" name="dataMeta" autoComplete="off" value={novaMeta.dataMeta} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="descricao">{t("metasFinanceiras.formDescription")}</label>
                    <input type="text" id="descricao" name="descricao" placeholder={t("metasFinanceiras.formDescriptionPlaceholder")} autoComplete="off" value={novaMeta.descricao} onChange={handleInputChange} />
                  </div>
                  <button type="submit" className="btn-salvar">{t("metasFinanceiras.saveButton")}</button>
                </form>
              </div>
            </div>
          )}

          {/* Modal de edição */}
          {modalEdicaoAberto && metaEditando && (
            <div className="modal-overlay" onClick={fecharModalEdicao}>
              <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
                <button className="modal-fechar" onClick={fecharModalEdicao}><X size={24} /></button>
                <h2>{t("metasFinanceiras.modalEdit")}</h2>
                <form className="mf-form" onSubmit={handleEditarMeta}>
                  <div className="form-group">
                    <label htmlFor="edit-titulo">{t("metasFinanceiras.formTitle")}</label>
                    <input type="text" id="edit-titulo" name="titulo" autoComplete="off" value={metaEditando.titulo} onChange={handleEdicaoChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-valorAlvo">{t("metasFinanceiras.formTargetValue")}</label>
                    <input type="number" id="edit-valorAlvo" name="valorAlvo" step="0.01" min="0" autoComplete="off" value={metaEditando.valorAlvo} onChange={handleEdicaoChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-dataMeta">{t("metasFinanceiras.formTargetDate")}</label>
                    <input type="date" id="edit-dataMeta" name="dataMeta" autoComplete="off" value={metaEditando.dataMeta} onChange={handleEdicaoChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-descricao">{t("metasFinanceiras.formDescription")}</label>
                    <input type="text" id="edit-descricao" name="descricao" autoComplete="off" value={metaEditando.descricao} onChange={handleEdicaoChange} />
                  </div>
                  <button type="submit" className="btn-salvar">{t("metasFinanceiras.saveEditButton")}</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MetasFinanceiras;