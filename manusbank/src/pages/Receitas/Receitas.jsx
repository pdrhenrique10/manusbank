import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Receitas.css";
import { Plus, X, Trash2, Pencil, TrendingUp } from "lucide-react";
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
import { useCurrency } from "../../context/CurrencyProvider";
import { useIdioma } from "../../context/IdiomaContext"; // 👈 tradução

function extrairData(isoString) {
  if (!isoString) return new Date().toISOString().substring(0, 10);
  if (typeof isoString === "string" && /^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    return isoString;
  }
  const d = new Date(isoString + "T00:00:00");
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  if (!data) return "-";
  const [ano, mes, dia] = data.substring(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function Money({ value }) {
  const { formatMoney } = useCurrency();
  return <span>{formatMoney(value)}</span>;
}

function Receitas() {
  const navigate = useNavigate();
  const { t } = useIdioma(); // 👈 hook de tradução
  const {
    formatMoney,
    convertToBRL,
    currency,
    setCurrency,
    getCurrencySymbol,
  } = useCurrency();

  const [modalAberto, setModalAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [receitas, setReceitas] = useState([]);
  const [novaReceita, setNovaReceita] = useState({
    nome: "",
    valor: "",
    data: new Date().toISOString().substring(0, 10),
  });
  const [receitaEditando, setReceitaEditando] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);

  const fecharModal = () => {
    setModalAberto(false);
    setNovaReceita({ nome: "", valor: "", data: new Date().toISOString().substring(0, 10) });
    setErro("");
  };

  const fecharModalEdicao = () => {
    setModalEdicaoAberto(false);
    setReceitaEditando(null);
    setErro("");
  };

  const carregarReceitas = useCallback(
    async (token) => {
      try {
        setCarregando(true);
        setErro("");
        setSucesso("");

        const resp = await fetch(`${API_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          if (resp.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }
          const receitasLocal = JSON.parse(localStorage.getItem("receitas") || "[]");
          setReceitas(receitasLocal);
          setCarregando(false);
          return;
        }

        const dados = await resp.json();
        const receitasBackend = (dados.transacoes || [])
          .filter((t) => t.tipo === "deposito" || t.tipo === "transferenciaEntrada")
          .map((t) => ({
            id: t.id,
            nome: t.descricao || t("receitas.defaultName"),
            valor: Number(t.valor) || 0,
            data: extrairData(t.data),
          }));

        setReceitas(receitasBackend);
        localStorage.setItem("receitas", JSON.stringify(receitasBackend));
      } catch (e) {
        console.error("Erro ao carregar receitas:", e);
        const receitasLocal = JSON.parse(localStorage.getItem("receitas") || "[]");
        setReceitas(receitasLocal);
        setErro(t("receitas.errorLoading"));
      } finally {
        setCarregando(false);
      }
    },
    [navigate, t]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    carregarReceitas(token);
  }, [navigate, carregarReceitas]);

  const dadosGrafico = receitas.map((r) => ({
    nome: r.nome.length > 15 ? r.nome.substring(0, 15) + "..." : r.nome,
    valor: Number(r.valor) || 0,
  }));

  const totalReceitas = receitas.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaReceita((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdicaoChange = (e) => {
    const { name, value } = e.target;
    setReceitaEditando((prev) => ({ ...prev, [name]: value }));
  };

  async function handleAdicionarReceita(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!novaReceita.nome || !novaReceita.valor || !novaReceita.data) {
      setErro(t("receitas.errorAllFields"));
      return;
    }

    const valorDigitado = parseFloat(String(novaReceita.valor).replace(",", "."));
    if (isNaN(valorDigitado) || valorDigitado <= 0) {
      setErro(t("receitas.errorInvalidValue"));
      return;
    }

    const valorEmReal = convertToBRL(valorDigitado);
    const dataFormatada = novaReceita.data.substring(0, 10);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const novaReceitaObj = {
      id: Date.now(),
      nome: novaReceita.nome,
      valor: valorEmReal,
      data: dataFormatada,
    };

    try {
      const resp = await fetch(`${API_URL}/api/transacao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tipo: "deposito",
          valor: valorEmReal,
          descricao: novaReceita.nome,
          data: dataFormatada,
          categoria: novaReceita.nome,
        }),
      });

      const dados = await resp.json();
      if (!resp.ok || !dados.sucesso) {
        setReceitas((prev) => [...prev, novaReceitaObj]);
        localStorage.setItem("receitas", JSON.stringify([...receitas, novaReceitaObj]));
        setSucesso(t("receitas.savedLocally"));
        fecharModal();
        return;
      }

      const receita = {
        id: dados.transacao?.id ?? Date.now(),
        nome: novaReceita.nome,
        valor: valorEmReal,
        data: dataFormatada,
      };
      setReceitas((prev) => [...prev, receita]);
      localStorage.setItem("receitas", JSON.stringify([...receitas, receita]));
      fecharModal();
      setSucesso(t("receitas.savedSuccess"));
    } catch (err) {
      console.error("Erro ao salvar receita:", err);
      setReceitas((prev) => [...prev, novaReceitaObj]);
      localStorage.setItem("receitas", JSON.stringify([...receitas, novaReceitaObj]));
      setSucesso(t("receitas.savedOffline"));
      fecharModal();
    }
  }

  async function handleRemoverReceita(id) {
    const confirmar = window.confirm(t("receitas.confirmDelete"));
    if (!confirmar) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/transacao/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = await resp.json();

      if (!resp.ok || !dados.sucesso) {
        setReceitas((prev) => prev.filter((r) => r.id !== id));
        localStorage.setItem("receitas", JSON.stringify(receitas.filter((r) => r.id !== id)));
        setSucesso(t("receitas.deletedLocally"));
        return;
      }

      setReceitas((prev) => prev.filter((r) => r.id !== id));
      localStorage.setItem("receitas", JSON.stringify(receitas.filter((r) => r.id !== id)));
      setSucesso(t("receitas.deletedSuccess"));
    } catch (e) {
      console.error("Erro ao remover receita:", e);
      setReceitas((prev) => prev.filter((r) => r.id !== id));
      localStorage.setItem("receitas", JSON.stringify(receitas.filter((r) => r.id !== id)));
      setSucesso(t("receitas.deletedLocally"));
    }
  }

  async function handleEditarReceita(e) {
    e.preventDefault();
    if (!receitaEditando) return;

    setErro("");
    setSucesso("");

    const valorDigitado = parseFloat(String(receitaEditando.valor).replace(",", "."));
    if (isNaN(valorDigitado) || valorDigitado <= 0) {
      setErro(t("receitas.errorInvalidValue"));
      return;
    }

    const valorEmReal = convertToBRL(valorDigitado);
    const dataFormatada = receitaEditando.data.substring(0, 10);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/transacao/${receitaEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          valor: valorEmReal,
          data: dataFormatada,
          descricao: receitaEditando.nome,
          tipo: "deposito",
          categoria: receitaEditando.nome,
        }),
      });

      const resultado = await resp.json();
      if (!resp.ok || !resultado.sucesso) {
        setErro(resultado.erro || t("receitas.errorUpdating"));
        return;
      }

      const receitasAtualizadas = receitas.map((r) =>
        r.id === receitaEditando.id
          ? { ...r, nome: receitaEditando.nome, valor: valorEmReal, data: dataFormatada }
          : r
      );
      setReceitas(receitasAtualizadas);
      localStorage.setItem("receitas", JSON.stringify(receitasAtualizadas));
      setSucesso(t("receitas.updatedSuccess"));
      fecharModalEdicao();
    } catch (err) {
      console.error("Erro ao editar receita:", err);
      setErro(t("receitas.errorUpdating"));
    }
  }

  const abrirModalEdicao = (receita) => {
    setReceitaEditando({
      id: receita.id,
      nome: receita.nome,
      valor: receita.valor,
      data: receita.data,
    });
    setModalEdicaoAberto(true);
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
    <div style={{ display: "flex", minHeight: "100vh" }} className={modalAbertoOuEditando ? "modo-modal" : ""}>
      <Sidebar />
      <main style={{ flex: 1, padding: "20px" }}>
        <div className="receitas-container">
          <div className="receitas-card">
            <header className="receitas-header">
              <h1>{t("receitas.title")}</h1>
              <p className="substring">{t("receitas.subtitle")}</p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}
            {sucesso && <p className="sucesso-msg">{sucesso}</p>}

            <div className="resumo-card">
              <div className="resumo-item">
                <span style={{ fontSize: 24, fontWeight: 'bold', display: 'inline-block' }}>
                  {getCurrencySymbol()}
                </span>
                <div>
                  <p className="resumo-label">{t("receitas.totalLabel")}</p>
                  <p className="resumo-valor">
                    <Money value={totalReceitas} />
                  </p>
                </div>
              </div>
              <div className="resumo-item-secundario">
                <TrendingUp size={20} />
                <p className="resumo-secundario-label">
                  {t("receitas.countLabel", { count: receitas.length })}
                </p>
              </div>
            </div>

            <button className="btn-nova-receita" onClick={() => setModalAberto(true)}>
              <Plus size={20} /> {t("receitas.newButton")}
            </button>

            <section className="grafico-section">
              <h2>{t("receitas.chartTitle")}</h2>
              <div className="grafico-container">
                {receitas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="3 3" />
                      <XAxis dataKey="nome" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={false}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                          boxShadow: "0 10px 20px rgba(0,0,0,.25)",
                        }}
                        labelStyle={{ color: "#f8fafc" }}
                        formatter={(value) => [formatMoney(value), t("receitas.chartValueLabel")]}
                      />
                      <Bar dataKey="valor" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grafico-vazio">
                    <p>{t("receitas.noDataChart")}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="lista-receitas">
              <h2>{t("receitas.listTitle")}</h2>
              <div className="lista-container">
                {receitas.length > 0 ? (
                  receitas.map((receita) => (
                    <div key={receita.id} className="receita-item">
                      <div className="receita-info">
                        <h3>{receita.nome}</h3>
                        <p className="receita-data">{formatarData(receita.data)}</p>
                      </div>
                      <div className="receita-actions">
                        <p className="receita-valor">
                          <Money value={receita.valor} />
                        </p>
                        <button
                          className="btn-editar-receita"
                          onClick={() => abrirModalEdicao(receita)}
                          title={t("receitas.editTitle")}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn-remover-receita"
                          onClick={() => handleRemoverReceita(receita.id)}
                          title={t("receitas.deleteTitle")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="lista-vazia">
                    <p>{t("receitas.noDataList")}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Modal de criação */}
          {modalAberto && (
            <div className="modal-overlay" onClick={fecharModal}>
              <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
                <button className="modal-fechar" onClick={fecharModal}>
                  <X size={24} />
                </button>
                <h2>{t("receitas.modalCreate")}</h2>
                <form className="forma-receita" onSubmit={handleAdicionarReceita}>
                  <div className="form-group">
                    <label htmlFor="nome">{t("receitas.formName")}</label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      placeholder={t("receitas.formNamePlaceholder")}
                      autoComplete="off"
                      value={novaReceita.nome}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="valor">{t("receitas.formValue")}</label>
                    <input
                      type="number"
                      id="valor"
                      name="valor"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      autoComplete="off"
                      value={novaReceita.valor}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="data">{t("receitas.formDate")}</label>
                    <input
                      type="date"
                      id="data"
                      name="data"
                      autoComplete="off"
                      value={novaReceita.data}
                      onChange={handleInputChange}
                    />
                  </div>
                  <button type="submit" className="btn-salvar">
                    {t("receitas.saveButton")}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Modal de edição */}
          {modalEdicaoAberto && receitaEditando && (
            <div className="modal-overlay" onClick={fecharModalEdicao}>
              <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
                <button className="modal-fechar" onClick={fecharModalEdicao}>
                  <X size={24} />
                </button>
                <h2>{t("receitas.modalEdit")}</h2>
                <form className="forma-receita" onSubmit={handleEditarReceita}>
                  <div className="form-group">
                    <label htmlFor="edit-nome">{t("receitas.formName")}</label>
                    <input
                      type="text"
                      id="edit-nome"
                      name="nome"
                      autoComplete="off"
                      value={receitaEditando.nome}
                      onChange={handleEdicaoChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-valor">{t("receitas.formValue")}</label>
                    <input
                      type="number"
                      id="edit-valor"
                      name="valor"
                      step="0.01"
                      min="0"
                      autoComplete="off"
                      value={receitaEditando.valor}
                      onChange={handleEdicaoChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-data">{t("receitas.formDate")}</label>
                    <input
                      type="date"
                      id="edit-data"
                      name="data"
                      autoComplete="off"
                      value={receitaEditando.data}
                      onChange={handleEdicaoChange}
                    />
                  </div>
                  <button type="submit" className="btn-salvar">
                    {t("receitas.saveEditButton")}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Receitas;