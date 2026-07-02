import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./ContasPagar.css";
import {
  Plus,
  X,
  CreditCard,
  CalendarClock,
  AlertTriangle,
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
import { useIdioma } from "../../context/IdiomaContext";

function Money({ value }) {
  const { formatFromBRL } = useCurrency();
  return <span>{formatFromBRL(value)}</span>;
}

function ContasPagar() {
  const navigate = useNavigate();
  const { t } = useIdioma();
  const { getCurrencySymbol } = useCurrency();

  const [modalAberto, setModalAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [contas, setContas] = useState([]);
  const [novaConta, setNovaConta] = useState({
    titulo: "",
    tipo: "",
    valor: "",
    vencimento: "",
    descricao: "",
  });
  const [contaEditando, setContaEditando] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    carregarContas(token);
  }, [navigate]);

  async function carregarContas(token) {
    try {
      setCarregando(true);
      setErro("");
      setSucesso("");

      const resp = await fetch(`${API_URL}/api/contas-pagar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!resp.ok) {
        const contasLocal = JSON.parse(
          localStorage.getItem("contasPagar") || "[]"
        );
        setContas(contasLocal);
        setCarregando(false);
        return;
      }

      const dados = await resp.json();
      const normalizadas = (dados || []).map((c) => ({
        ...c,
        valor: Number(c.valor) || 0,
      }));
      setContas(normalizadas);
      localStorage.setItem("contasPagar", JSON.stringify(normalizadas));
    } catch (e) {
      console.error("Erro ao carregar contas a pagar:", e);
      const contasLocal = JSON.parse(
        localStorage.getItem("contasPagar") || "[]"
      );
      setContas(contasLocal);
      setErro(t("contasPagar.errorLoading"));
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

  const dadosGrafico = contas
    .filter((c) => c.status === "pendente")
    .map((c) => ({
      nome:
        c.titulo.length > 15 ? c.titulo.substring(0, 15) + "..." : c.titulo,
      valor: Number(c.valor) || 0,
    }));

  const totalPagar = contas
    .filter((c) => c.status === "pendente")
    .reduce((acc, c) => acc + (Number(c.valor) || 0), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaConta((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdicaoChange = (e) => {
    const { name, value } = e.target;
    setContaEditando((prev) => ({ ...prev, [name]: value }));
  };

  const fecharModalEdicao = () => {
    setModalEdicaoAberto(false);
    setContaEditando(null);
    setErro("");
  };

  const abrirModalEdicao = (conta) => {
    setContaEditando({
      id: conta.id,
      titulo: conta.titulo,
      tipo: conta.tipo || "",
      valor: conta.valor,
      vencimento: String(conta.vencimento || "").substring(0, 10),
      descricao: conta.descricao || "",
    });
    setModalEdicaoAberto(true);
  };

  const handleEditarConta = async (e) => {
    e.preventDefault();
    if (!contaEditando) return;

    setErro("");
    setSucesso("");

    if (
      !contaEditando.titulo ||
      !contaEditando.valor ||
      !contaEditando.vencimento
    ) {
      setErro(t("contasPagar.errorAllFields"));
      return;
    }

    const valorDigitado = parseFloat(
      String(contaEditando.valor).replace(",", ".")
    );
    if (isNaN(valorDigitado) || valorDigitado <= 0) {
      setErro(t("contasPagar.errorInvalidValue"));
      return;
    }

    const valorEmReal = valorDigitado; // já está em BRL
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(
        `${API_URL}/api/contas-pagar/${contaEditando.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            titulo: contaEditando.titulo,
            tipo: contaEditando.tipo,
            valor: valorEmReal,
            vencimento: contaEditando.vencimento,
            descricao: contaEditando.descricao,
          }),
        }
      );

      const resultado = await resp.json();

      if (!resp.ok || !resultado.sucesso) {
        setErro(resultado.erro || t("contasPagar.errorUpdating"));
        return;
      }

      const atualizada = {
        ...resultado.conta,
        valor: Number(resultado.conta.valor) || 0,
      };
      const contasAtualizadas = contas.map((c) =>
        c.id === atualizada.id ? atualizada : c
      );
      setContas(contasAtualizadas);
      localStorage.setItem("contasPagar", JSON.stringify(contasAtualizadas));
      setSucesso(t("contasPagar.updatedSuccess"));
      fecharModalEdicao();
    } catch (err) {
      console.error("Erro ao editar conta:", err);
      setErro(t("contasPagar.errorUpdating"));
    }
  };

  const handleAdicionarConta = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!novaConta.titulo || !novaConta.valor || !novaConta.vencimento) {
      setErro(t("contasPagar.errorAllFields"));
      return;
    }

    const valorDigitado = parseFloat(
      String(novaConta.valor).replace(",", ".")
    );
    if (isNaN(valorDigitado) || valorDigitado <= 0) {
      setErro(t("contasPagar.errorInvalidValue"));
      return;
    }

    const valorEmReal = valorDigitado; // já está em BRL
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const novaContaObj = {
      id: Date.now(),
      titulo: novaConta.titulo,
      tipo: novaConta.tipo,
      valor: valorEmReal,
      vencimento: novaConta.vencimento,
      descricao: novaConta.descricao,
      status: "pendente",
    };

    try {
      const body = {
        titulo: novaConta.titulo,
        tipo: novaConta.tipo,
        valor: valorEmReal,
        vencimento: novaConta.vencimento,
        descricao: novaConta.descricao,
      };

      const resp = await fetch(`${API_URL}/api/contas-pagar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        // fallback local
        setContas((prev) => [...prev, novaContaObj]);
        localStorage.setItem(
          "contasPagar",
          JSON.stringify([...contas, novaContaObj])
        );
        setSucesso(t("contasPagar.savedLocally"));
        setModalAberto(false);
        setNovaConta({
          titulo: "",
          tipo: "",
          valor: "",
          vencimento: "",
          descricao: "",
        });
        return;
      }

      const criada = await resp.json();
      const contaComValor = {
        ...criada,
        valor: Number(criada.valor) || 0,
      };
      setContas((prev) => [...prev, contaComValor]);
      localStorage.setItem(
        "contasPagar",
        JSON.stringify([...contas, contaComValor])
      );
      setNovaConta({
        titulo: "",
        tipo: "",
        valor: "",
        vencimento: "",
        descricao: "",
      });
      setModalAberto(false);
      setSucesso(t("contasPagar.savedSuccess"));
    } catch (e) {
      console.error("Erro ao salvar conta:", e);
      setContas((prev) => [...prev, novaContaObj]);
      localStorage.setItem(
        "contasPagar",
        JSON.stringify([...contas, novaContaObj])
      );
      setSucesso(t("contasPagar.savedOffline"));
      setModalAberto(false);
      setNovaConta({
        titulo: "",
        tipo: "",
        valor: "",
        vencimento: "",
        descricao: "",
      });
    }
  };

  const handleMarcarComoPaga = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/contas-pagar/${id}/pagar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        const atualizadas = contas.map((c) =>
          c.id === id ? { ...c, status: "pago" } : c
        );
        setContas(atualizadas);
        localStorage.setItem("contasPagar", JSON.stringify(atualizadas));
        setSucesso(t("contasPagar.markedAsPaidLocally"));
        return;
      }

      const { conta } = await resp.json();
      const contaAtualizada = {
        ...conta,
        valor: Number(conta.valor) || 0,
      };
      const novas = contas.map((c) =>
        c.id === contaAtualizada.id ? contaAtualizada : c
      );
      setContas(novas);
      localStorage.setItem("contasPagar", JSON.stringify(novas));
      setSucesso(t("contasPagar.markedAsPaid"));
    } catch (e) {
      console.error("Erro ao marcar conta como paga:", e);
      setErro(t("contasPagar.errorMarkingPaid"));
    }
  };

  const handleRemoverConta = async (id) => {
    const confirmar = window.confirm(t("contasPagar.confirmDelete"));
    if (!confirmar) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/contas-pagar/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = await resp.json();

      const filtradas = contas.filter((c) => c.id !== id);

      if (!resp.ok || !dados.sucesso) {
        setContas(filtradas);
        localStorage.setItem("contasPagar", JSON.stringify(filtradas));
        setSucesso(t("contasPagar.deletedLocally"));
        return;
      }

      setContas(filtradas);
      localStorage.setItem("contasPagar", JSON.stringify(filtradas));
      setSucesso(t("contasPagar.deletedSuccess"));
    } catch (e) {
      console.error("Erro ao remover conta:", e);
      const filtradas = contas.filter((c) => c.id !== id);
      setContas(filtradas);
      localStorage.setItem("contasPagar", JSON.stringify(filtradas));
      setSucesso(t("contasPagar.deletedLocally"));
    }
  };

  if (carregando) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "20px" }}>
          {t("geral.loading")}
        </main>
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
        <div className="cp-container">
          <div className="cp-card">
            <header className="cp-header">
              <h1>{t("contasPagar.title")}</h1>
              <p className="subtitle">{t("contasPagar.subtitle")}</p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}
            {sucesso && <p className="sucesso-msg">{sucesso}</p>}

            <div className="cp-resumo-card">
              <div className="cp-resumo-item">
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    display: "inline-block",
                  }}
                >
                  {getCurrencySymbol()}
                </span>
                <div>
                  <p className="cp-resumo-label">
                    {t("contasPagar.totalLabel")}
                  </p>
                  <p className="cp-resumo-valor">
                    <Money value={totalPagar} />
                  </p>
                </div>
              </div>
              <div className="cp-resumo-item-secundario">
                <CalendarClock size={20} />
                <p className="cp-resumo-secundario-label">
                  {t("contasPagar.countLabel", {
                    count: contas.filter((c) => c.status === "pendente").length,
                  })}
                </p>
              </div>
            </div>

            <button
              className="cp-btn-nova"
              onClick={() => setModalAberto(true)}
            >
              <Plus size={20} /> {t("contasPagar.newButton")}
            </button>

            <section className="cp-grafico-section">
              <h2>{t("contasPagar.chartTitle")}</h2>
              <div className="cp-grafico-container">
                {carregando ? (
                  <div className="cp-grafico-vazio">
                    <p>{t("contasPagar.loadingChart")}</p>
                  </div>
                ) : dadosGrafico.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />
                      <XAxis dataKey="nome" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          background: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#f8fafc" }}
                        formatter={(value) => [
                          <Money value={value} />,
                          t("contasPagar.chartValueLabel"),
                        ]}
                      />
                      <Bar
                        dataKey="valor"
                        fill="#f97316"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="cp-grafico-vazio">
                    <p>{t("contasPagar.noDataChart")}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="cp-lista">
              <h2>{t("contasPagar.listTitle")}</h2>
              <div className="cp-lista-container">
                {carregando ? (
                  <div className="cp-lista-vazia">
                    <p>{t("contasPagar.loadingList")}</p>
                  </div>
                ) : contas.length > 0 ? (
                  contas.map((conta) => {
                    const isPendente = conta.status === "pendente";
                    const isPago = conta.status === "pago";

                    let vencimentoDate = null;
                    let vencimentoFormatado = "-";
                    if (conta.vencimento) {
                      const raw =
                        conta.vencimento.length === 10
                          ? conta.vencimento + "T00:00:00"
                          : conta.vencimento;
                      vencimentoDate = new Date(raw);
                      vencimentoFormatado =
                        vencimentoDate.toLocaleDateString("pt-BR");
                    }

                    const hoje = new Date();
                    const hojeSoData = new Date(
                      hoje.getFullYear(),
                      hoje.getMonth(),
                      hoje.getDate()
                    );
                    const isAtrasado =
                      isPendente &&
                      vencimentoDate &&
                      vencimentoDate < hojeSoData;

                    let statusLabel = "";
                    let statusClass = "";
                    if (isPago) {
                      statusLabel = t("contasPagar.statusPaid");
                      statusClass = "cp-status pago";
                    } else if (isAtrasado) {
                      statusLabel = t("contasPagar.statusLate");
                      statusClass = "cp-status atrasado";
                    } else if (isPendente) {
                      statusLabel = t("contasPagar.statusPending");
                      statusClass = "cp-status pendente";
                    }

                    return (
                      <div key={conta.id} className="cp-item">
                        <div className="cp-info">
                          <h3>
                            {conta.titulo}{" "}
                            {statusLabel && (
                              <span className={statusClass}>
                                {statusLabel}
                              </span>
                            )}
                          </h3>
                          <p className="cp-data">
                            {t("contasPagar.dueDate")}:{" "}
                            {vencimentoFormatado}
                          </p>
                          {conta.tipo && (
                            <p className="cp-data">
                              {t("contasPagar.type")}: {conta.tipo}
                            </p>
                          )}
                          {conta.descricao && (
                            <p className="cp-data">
                              {conta.descricao}
                            </p>
                          )}
                        </div>
                        <div className="cp-acoes">
                          <div className="cp-valor-e-remover">
                            <p className="cp-valor">
                              <Money value={conta.valor} />
                            </p>
                            {isPendente && (
                              <button
                                className="cp-btn-editar"
                                onClick={() => abrirModalEdicao(conta)}
                                title={t("contasPagar.editTitle")}
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            <button
                              className="cp-btn-remover"
                              onClick={() => handleRemoverConta(conta.id)}
                              title={t("contasPagar.deleteTitle")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {isPendente && (
                            <button
                              className="cp-btn-acao"
                              onClick={() => handleMarcarComoPaga(conta.id)}
                            >
                              {t("contasPagar.markAsPaid")}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="cp-lista-vazia">
                    <p>{t("contasPagar.noDataList")}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Modal de criação */}
          {modalAberto && (
            <div
              className="modal-overlay"
              onClick={() => setModalAberto(false)}
            >
              <div
                className="modal-conteudo"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="modal-fechar"
                  onClick={() => setModalAberto(false)}
                >
                  <X size={24} />
                </button>
                <h2>{t("contasPagar.modalCreate")}</h2>
                <form className="cp-form" onSubmit={handleAdicionarConta}>
                  <div className="form-group">
                    <label htmlFor="titulo">
                      {t("contasPagar.formName")}
                    </label>
                    <input
                      type="text"
                      id="titulo"
                      name="titulo"
                      autoComplete="off"
                      value={novaConta.titulo}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tipo">
                      {t("contasPagar.formType")}
                    </label>
                    <input
                      type="text"
                      id="tipo"
                      name="tipo"
                      placeholder={t(
                        "contasPagar.formTypePlaceholder"
                      )}
                      autoComplete="off"
                      value={novaConta.tipo}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="valor">
                      {t("contasPagar.formValue")}
                    </label>
                    <input
                      type="number"
                      id="valor"
                      name="valor"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      autoComplete="off"
                      value={novaConta.valor}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="vencimento">
                      {t("contasPagar.formDueDate")}
                    </label>
                    <input
                      type="date"
                      id="vencimento"
                      name="vencimento"
                      autoComplete="off"
                      value={novaConta.vencimento}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="descricao">
                      {t("contasPagar.formDescription")}
                    </label>
                    <input
                      type="text"
                      id="descricao"
                      name="descricao"
                      placeholder={t(
                        "contasPagar.formDescriptionPlaceholder"
                      )}
                      autoComplete="off"
                      value={novaConta.descricao}
                      onChange={handleInputChange}
                    />
                  </div>
                  <button type="submit" className="btn-salvar">
                    {t("contasPagar.saveButton")}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Modal de edição */}
          {modalEdicaoAberto && contaEditando && (
            <div className="modal-overlay" onClick={fecharModalEdicao}>
              <div
                className="modal-conteudo"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="modal-fechar"
                  onClick={fecharModalEdicao}
                >
                  <X size={24} />
                </button>
                <h2>{t("contasPagar.modalEdit")}</h2>
                <form className="cp-form" onSubmit={handleEditarConta}>
                  <div className="form-group">
                    <label htmlFor="edit-titulo">
                      {t("contasPagar.formName")}
                    </label>
                    <input
                      type="text"
                      id="edit-titulo"
                      name="titulo"
                      autoComplete="off"
                      value={contaEditando.titulo}
                      onChange={handleEdicaoChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-tipo">
                      {t("contasPagar.formType")}
                    </label>
                    <input
                      type="text"
                      id="edit-tipo"
                      name="tipo"
                      autoComplete="off"
                      value={contaEditando.tipo}
                      onChange={handleEdicaoChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-valor">
                      {t("contasPagar.formValue")}
                    </label>
                    <input
                      type="number"
                      id="edit-valor"
                      name="valor"
                      step="0.01"
                      min="0"
                      autoComplete="off"
                      value={contaEditando.valor}
                      onChange={handleEdicaoChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-vencimento">
                      {t("contasPagar.formDueDate")}
                    </label>
                    <input
                      type="date"
                      id="edit-vencimento"
                      name="vencimento"
                      autoComplete="off"
                      value={contaEditando.vencimento}
                      onChange={handleEdicaoChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-descricao">
                      {t("contasPagar.formDescription")}
                    </label>
                    <input
                      type="text"
                      id="edit-descricao"
                      name="descricao"
                      autoComplete="off"
                      value={contaEditando.descricao}
                      onChange={handleEdicaoChange}
                    />
                  </div>
                  <button type="submit" className="btn-salvar">
                    {t("contasPagar.saveEditButton")}
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

export default ContasPagar;