import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Despesas.css";
import {
  Plus,
  X,
  Wallet,
  TrendingDown,
  CreditCard,
  Trash2,
  Pencil,
} from "lucide-react";
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
  if (typeof isoString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    return isoString;
  }
  const d = new Date(isoString + 'T00:00:00');
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

function Despesas() {
  const navigate = useNavigate();
  const { t } = useIdioma(); // 👈 hook de tradução
  const { 
    formatMoney, 
    convertToBRL, 
    currency, 
    setCurrency, 
    getCurrencySymbol 
  } = useCurrency();

  const [modalAberto, setModalAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [despesas, setDespesas] = useState([]);
  const [novaDespesa, setNovaDespesa] = useState({
    nome: "",
    valor: "",
    data: new Date().toISOString().substring(0, 10),
  });
  const [despesaEditando, setDespesaEditando] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const fecharModal = () => {
    setModalAberto(false);
    setNovaDespesa({ nome: "", valor: "", data: new Date().toISOString().substring(0, 10) });
    setErro("");
  };

  const fecharModalEdicao = () => {
    setModalEdicaoAberto(false);
    setDespesaEditando(null);
    setErro("");
  };

  const carregarDespesas = useCallback(async (token) => {
    try {
      setCarregando(true);
      setErro("");
      setSucesso("");

      const resp = await fetch(`${API_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resp.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!resp.ok) {
        const despesasLocal = JSON.parse(localStorage.getItem('despesas') || '[]');
        setDespesas(despesasLocal);
        setCarregando(false);
        return;
      }

      const dados = await resp.json();
      const todasTransacoes = dados.transacoes || [];

      const apenasDespesas = todasTransacoes
        .filter(t => t.tipo === "saque" || t.tipo === "transferenciaSaida")
        .map(t => ({
          id: t.id,
          nome: t.descricao || t("despesas.defaultName"),
          valor: Number(t.valor) || 0,
          data: extrairData(t.data),
        }));

      setDespesas(apenasDespesas);
      localStorage.setItem('despesas', JSON.stringify(apenasDespesas));
    } catch (e) {
      console.error("Erro ao carregar despesas:", e);
      const despesasLocal = JSON.parse(localStorage.getItem('despesas') || '[]');
      setDespesas(despesasLocal);
      setErro(t("despesas.errorLoading"));
    } finally {
      setCarregando(false);
    }
  }, [navigate, t]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    carregarDespesas(token);
  }, [navigate, carregarDespesas]);

  useEffect(() => {
    if (sucesso) {
      const timer = setTimeout(() => setSucesso(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [sucesso]);

  const dadosGrafico = despesas.map(d => ({
    nome: d.nome.length > 15 ? d.nome.substring(0, 15) + "..." : d.nome,
    valor: Number(d.valor) || 0,
  }));

  const totalDespesas = despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaDespesa(prev => ({ ...prev, [name]: value }));
  };

  const handleEdicaoChange = (e) => {
    const { name, value } = e.target;
    setDespesaEditando(prev => ({ ...prev, [name]: value }));
  };

  const handleAdicionarDespesa = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!novaDespesa.nome || !novaDespesa.valor || !novaDespesa.data) {
      setErro(t("despesas.errorAllFields"));
      return;
    }

    const valorDigitado = parseFloat(String(novaDespesa.valor).replace(",", "."));
    if (isNaN(valorDigitado) || valorDigitado <= 0) {
      setErro(t("despesas.errorInvalidValue"));
      return;
    }

    const valorEmReal = convertToBRL(valorDigitado);
    const dataFormatada = novaDespesa.data.substring(0, 10);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const novaDespesaObj = {
      id: Date.now(),
      nome: novaDespesa.nome,
      valor: valorEmReal,
      data: dataFormatada,
    };

    try {
      const resp = await fetch(`${API_URL}/api/transacao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tipo: "saque",
          valor: valorEmReal,
          descricao: novaDespesa.nome,
          data: dataFormatada,
          categoria: novaDespesa.nome,
        }),
      });

      const resultado = await resp.json();

      if (!resp.ok || !resultado.sucesso) {
        setDespesas(prev => [...prev, novaDespesaObj]);
        localStorage.setItem('despesas', JSON.stringify([...despesas, novaDespesaObj]));
        setSucesso(t("despesas.savedLocally"));
        fecharModal();
        return;
      }

      const despesaLocal = {
        id: resultado.transacao?.id ?? Date.now(),
        nome: novaDespesa.nome,
        valor: valorEmReal,
        data: dataFormatada,
      };
      setDespesas(prev => [...prev, despesaLocal]);
      localStorage.setItem('despesas', JSON.stringify([...despesas, despesaLocal]));
      fecharModal();
      setSucesso(t("despesas.savedSuccess"));
    } catch (e) {
      console.error("Erro ao salvar despesa:", e);
      setDespesas(prev => [...prev, novaDespesaObj]);
      localStorage.setItem('despesas', JSON.stringify([...despesas, novaDespesaObj]));
      setSucesso(t("despesas.savedOffline"));
      fecharModal();
    }
  };

  async function handleRemoverDespesa(id) {
    const confirmar = window.confirm(t("despesas.confirmDelete"));
    if (!confirmar) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/transacao/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const dados = await resp.json();

      if (!resp.ok || !dados.sucesso) {
        setDespesas(prev => prev.filter(d => d.id !== id));
        localStorage.setItem('despesas', JSON.stringify(despesas.filter(d => d.id !== id)));
        setSucesso(t("despesas.deletedLocally"));
        return;
      }

      setDespesas(prev => prev.filter(d => d.id !== id));
      localStorage.setItem('despesas', JSON.stringify(despesas.filter(d => d.id !== id)));
      setSucesso(t("despesas.deletedSuccess"));
    } catch (e) {
      console.error("Erro ao remover despesa:", e);
      setDespesas(prev => prev.filter(d => d.id !== id));
      localStorage.setItem('despesas', JSON.stringify(despesas.filter(d => d.id !== id)));
      setSucesso(t("despesas.deletedLocally"));
    }
  }

  async function handleEditarDespesa(e) {
    e.preventDefault();
    if (!despesaEditando) return;

    setErro("");
    setSucesso("");

    const valorDigitado = parseFloat(String(despesaEditando.valor).replace(",", "."));
    if (isNaN(valorDigitado) || valorDigitado <= 0) {
      setErro(t("despesas.errorInvalidValue"));
      return;
    }

    const valorEmReal = convertToBRL(valorDigitado);
    const dataFormatada = despesaEditando.data.substring(0, 10);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/transacao/${despesaEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          valor: valorEmReal,
          data: dataFormatada,
          descricao: despesaEditando.nome,
          tipo: "saque",
          categoria: despesaEditando.nome,
        }),
      });

      const resultado = await resp.json();

      if (!resp.ok || !resultado.sucesso) {
        setErro(resultado.erro || t("despesas.errorUpdating"));
        return;
      }

      const despesasAtualizadas = despesas.map(d =>
        d.id === despesaEditando.id
          ? {
              ...d,
              nome: despesaEditando.nome,
              valor: valorEmReal,
              data: dataFormatada,
            }
          : d
      );
      setDespesas(despesasAtualizadas);
      localStorage.setItem('despesas', JSON.stringify(despesasAtualizadas));
      setSucesso(t("despesas.updatedSuccess"));
      fecharModalEdicao();
    } catch (err) {
      console.error("Erro ao editar despesa:", err);
      setErro(t("despesas.errorUpdating"));
    }
  }

  const abrirModalEdicao = (despesa) => {
    setDespesaEditando({
      id: despesa.id,
      nome: despesa.nome,
      valor: despesa.valor,
      data: despesa.data,
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
    <div
      style={{ display: "flex", minHeight: "100vh" }}
      className={modalAbertoOuEditando ? "modo-modal" : ""}
    >
      <Sidebar />
      <main style={{ flex: 1, padding: "20px" }}>
        <div className="despesas-container">
          <div className="despesas-card">
            <header className="despesas-header">
              <h1>{t("despesas.title")}</h1>
              <p className="subtitle">{t("despesas.subtitle")}</p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}
            {sucesso && <p className="sucesso-msg">{sucesso}</p>}

            <div className="resumo-card">
              <div className="resumo-item">
                <span style={{ fontSize: 24, fontWeight: 'bold', display: 'inline-block' }}>
                  {getCurrencySymbol()}
                </span>
                <div>
                  <p className="resumo-label">{t("despesas.totalLabel")}</p>
                  <p className="despesas-valor">
                    <Money value={totalDespesas} />
                  </p>
                </div>
              </div>
              <div className="resumo-item-secundario">
                <TrendingDown size={20} />
                <p className="resumo-secundario-label">
                  {t("despesas.countLabel", { count: despesas.length })}
                </p>
              </div>
            </div>

            <button className="btn-nova-despesa" onClick={() => setModalAberto(true)}>
              <Plus size={20} /> {t("despesas.newButton")}
            </button>

            <section className="grafico-section">
              <h2>{t("despesas.chartTitle")}</h2>
              <div className="grafico-container">
                {despesas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="nome" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        labelStyle={{ color: "#f8fafc" }}
                        formatter={(value) => [formatMoney(value), t("despesas.chartValueLabel")]}
                        cursor={false}
                      />
                      <Bar dataKey="valor" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grafico-vazio"><p>{t("despesas.noDataChart")}</p></div>
                )}
              </div>
            </section>

            <section className="lista-despesas">
              <h2>{t("despesas.listTitle")}</h2>
              <div className="lista-container">
                {despesas.length > 0 ? (
                  despesas.map(despesa => (
                    <div key={despesa.id} className="despesa-item">
                      <div className="despesa-info">
                        <h3>{despesa.nome}</h3>
                        <p className="despesa-data">{formatarData(despesa.data)}</p>
                      </div>
                      <div className="despesa-right">
                        <p className="despesa-valor">
                          <Money value={despesa.valor} />
                        </p>
                        <button className="btn-editar-despesa" onClick={() => abrirModalEdicao(despesa)} title={t("despesas.editTitle")}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn-remover-despesa" onClick={() => handleRemoverDespesa(despesa.id)} title={t("despesas.deleteTitle")}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="lista-vazia"><p>{t("despesas.noDataList")}</p></div>
                )}
              </div>
            </section>
          </div>

          {/* Modal de criação */}
          {modalAberto && (
            <div className="modal-overlay" onClick={fecharModal}>
              <div className="modal-conteudo" onClick={e => e.stopPropagation()}>
                <button className="modal-fechar" onClick={fecharModal}><X size={24} /></button>
                <h2>{t("despesas.modalCreate")}</h2>
                <form className="forma-despesa" onSubmit={handleAdicionarDespesa}>
                  <div className="form-group">
                    <label htmlFor="nome">{t("despesas.formName")}</label>
                    <input type="text" id="nome" name="nome" placeholder={t("despesas.formNamePlaceholder")} autoComplete="off" value={novaDespesa.nome} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="valor">{t("despesas.formValue")}</label>
                    <input type="number" id="valor" name="valor" placeholder="0.00" step="0.01" min="0" autoComplete="off" value={novaDespesa.valor} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="data">{t("despesas.formDate")}</label>
                    <input type="date" id="data" name="data" autoComplete="off" value={novaDespesa.data} onChange={handleInputChange} />
                  </div>
                  <button type="submit" className="btn-salvar">{t("despesas.saveButton")}</button>
                </form>
              </div>
            </div>
          )}

          {/* Modal de edição */}
          {modalEdicaoAberto && despesaEditando && (
            <div className="modal-overlay" onClick={fecharModalEdicao}>
              <div className="modal-conteudo" onClick={e => e.stopPropagation()}>
                <button className="modal-fechar" onClick={fecharModalEdicao}><X size={24} /></button>
                <h2>{t("despesas.modalEdit")}</h2>
                <form className="forma-despesa" onSubmit={handleEditarDespesa}>
                  <div className="form-group">
                    <label htmlFor="edit-nome">{t("despesas.formName")}</label>
                    <input type="text" id="edit-nome" name="nome" autoComplete="off" value={despesaEditando.nome} onChange={handleEdicaoChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-valor">{t("despesas.formValue")}</label>
                    <input type="number" id="edit-valor" name="valor" step="0.01" min="0" autoComplete="off" value={despesaEditando.valor} onChange={handleEdicaoChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-data">{t("despesas.formDate")}</label>
                    <input type="date" id="edit-data" name="data" autoComplete="off" value={despesaEditando.data} onChange={handleEdicaoChange} />
                  </div>
                  <button type="submit" className="btn-salvar">{t("despesas.saveEditButton")}</button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default Despesas;