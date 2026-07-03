import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./ContasReceber.css";
import {
  Plus,
  X,
  WalletCards,
  CalendarClock,
  BadgeDollarSign,
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

// Cada conta guarda sua própria moeda (vinda do backend) — exibida sem
// conversão. Ver CurrencyProvider: formatValorNaMoeda é o padrão pra
// itens individuais.
function Money({ value, moeda }) {
  const { formatValorNaMoeda } = useCurrency();
  return <span>{formatValorNaMoeda(value, moeda)}</span>;
}

function ContasReceber() {
  const navigate = useNavigate();
  const { t } = useIdioma(); // 👈 hook de tradução
  const {
    formatMoney,
    converterEntreMoedas,
    currency,
    setCurrency,
    getCurrencySymbol,
  } = useCurrency();

  const [modalAberto, setModalAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [contas, setContas] = useState([]);
  const [novaConta, setNovaConta] = useState({
    cliente: "",
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

      const resp = await fetch(`${API_URL}/api/contas-receber`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resp.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!resp.ok) {
        const contasLocal = JSON.parse(localStorage.getItem('contasReceber') || '[]');
        setContas(contasLocal);
        setCarregando(false);
        return;
      }

      const dados = await resp.json();
      const normalizadas = (dados || []).map(c => ({
        ...c,
        valor: Number(c.valor) || 0,
        moeda: c.moeda || "BRL", // 👈 garante que a moeda do item nunca se perde
      }));
      setContas(normalizadas);
      localStorage.setItem('contasReceber', JSON.stringify(normalizadas));
    } catch (e) {
      console.error("Erro ao carregar contas a receber:", e);
      const contasLocal = JSON.parse(localStorage.getItem('contasReceber') || '[]');
      setContas(contasLocal);
      setErro(t("contasReceber.errorLoading"));
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

  // Helper: valor do item convertido (número puro) para a moeda atual —
  // usado só pra AGREGAR (gráfico, total). Nunca pra exibir o item sozinho.
  const paraMoedaAtual = (item) =>
    converterEntreMoedas(item.valor, item.moeda || "BRL", currency);

  const dadosGrafico = contas
    .filter(c => c.status === "pendente")
    .map(c => ({
      nome: c.cliente.length > 15 ? c.cliente.substring(0, 15) + "..." : c.cliente,
      valor: paraMoedaAtual(c),
    }));

  const totalAberto = contas
    .filter(c => c.status === "pendente")
    .reduce((acc, c) => acc + paraMoedaAtual(c), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaConta(prev => ({ ...prev, [name]: value }));
  };

  const handleEdicaoChange = (e) => {
    const { name, value } = e.target;
    setContaEditando(prev => ({ ...prev, [name]: value }));
  };

  const fecharModalEdicao = () => {
    setModalEdicaoAberto(false);
    setContaEditando(null);
    setErro("");
  };

  const abrirModalEdicao = (conta) => {
    setContaEditando({
      id: conta.id,
      cliente: conta.cliente,
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

    if (!contaEditando.cliente || !contaEditando.valor || !contaEditando.vencimento) {
      setErro(t("contasReceber.errorAllFields"));
      return;
    }

    const valorDigitado = parseFloat(String(contaEditando.valor).replace(",", "."));
    if (isNaN(valorDigitado) || valorDigitado <= 0) {
      setErro(t("contasReceber.errorInvalidValue"));
      return;
    }

    // 👇 sem conversão — a moeda do item nunca muda na edição
    // (o backend já garante isso em PUT /api/contas-receber/:id)
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/contas-receber/${contaEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cliente: contaEditando.cliente,
          valor: valorDigitado,
          vencimento: contaEditando.vencimento,
          descricao: contaEditando.descricao,
        }),
      });

      const resultado = await resp.json();

      if (!resp.ok || !resultado.sucesso) {
        setErro(resultado.erro || t("contasReceber.errorUpdating"));
        return;
      }

      const atualizada = {
        ...resultado.conta,
        valor: Number(resultado.conta.valor) || 0,
        moeda: resultado.conta.moeda || "BRL",
      };
      const contasAtualizadas = contas.map(c =>
        c.id === atualizada.id ? atualizada : c
      );
      setContas(contasAtualizadas);
      localStorage.setItem("contasReceber", JSON.stringify(contasAtualizadas));
      setSucesso(t("contasReceber.updatedSuccess"));
      fecharModalEdicao();
    } catch (err) {
      console.error("Erro ao editar conta:", err);
      setErro(t("contasReceber.errorUpdating"));
    }
  };

  const handleAdicionarConta = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!novaConta.cliente || !novaConta.valor || !novaConta.vencimento) {
      setErro(t("contasReceber.errorAllFields"));
      return;
    }

    const valorDigitado = parseFloat(String(novaConta.valor).replace(",", "."));
    if (isNaN(valorDigitado) || valorDigitado <= 0) {
      setErro(t("contasReceber.errorInvalidValue"));
      return;
    }

    // 👇 valor digitado já está na moeda atualmente selecionada.
    // Quem decide qual moeda gravar é o backend (moedaAtualDoUsuario).
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const novaContaObj = {
      id: Date.now(),
      cliente: novaConta.cliente,
      valor: valorDigitado,
      moeda: currency,
      vencimento: novaConta.vencimento,
      descricao: novaConta.descricao,
      status: "pendente",
    };

    try {
      const body = {
        cliente: novaConta.cliente,
        valor: valorDigitado,
        vencimento: novaConta.vencimento,
        descricao: novaConta.descricao,
      };

      const resp = await fetch(`${API_URL}/api/contas-receber`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        setContas(prev => [...prev, novaContaObj]);
        localStorage.setItem('contasReceber', JSON.stringify([...contas, novaContaObj]));
        setSucesso(t("contasReceber.savedLocally"));
        setModalAberto(false);
        setNovaConta({ cliente: "", valor: "", vencimento: "", descricao: "" });
        return;
      }

      const criada = await resp.json();
      const contaComValor = {
        ...criada,
        valor: Number(criada.valor) || 0,
        moeda: criada.moeda || "BRL",
      };
      setContas(prev => [...prev, contaComValor]);
      localStorage.setItem('contasReceber', JSON.stringify([...contas, contaComValor]));
      setNovaConta({ cliente: "", valor: "", vencimento: "", descricao: "" });
      setModalAberto(false);
      setSucesso(t("contasReceber.savedSuccess"));
    } catch (e) {
      console.error("Erro ao salvar conta:", e);
      setContas(prev => [...prev, novaContaObj]);
      localStorage.setItem('contasReceber', JSON.stringify([...contas, novaContaObj]));
      setSucesso(t("contasReceber.savedOffline"));
      setModalAberto(false);
      setNovaConta({ cliente: "", valor: "", vencimento: "", descricao: "" });
    }
  };

  const handleMarcarComoPaga = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/contas-receber/${id}/pagar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      if (!resp.ok) {
        setContas(prev =>
          prev.map(c => (c.id === id ? { ...c, status: "pago" } : c))
        );
        localStorage.setItem('contasReceber', JSON.stringify(contas.map(c => c.id === id ? { ...c, status: "pago" } : c)));
        setSucesso(t("contasReceber.markedAsPaidLocally"));
        return;
      }

      const { conta } = await resp.json();
      const contaComMoeda = { ...conta, valor: Number(conta.valor) || 0, moeda: conta.moeda || "BRL" };
      setContas(prev =>
        prev.map(c => (c.id === contaComMoeda.id ? contaComMoeda : c))
      );
      localStorage.setItem('contasReceber', JSON.stringify(contas.map(c => c.id === contaComMoeda.id ? contaComMoeda : c)));
      setSucesso(t("contasReceber.markedAsPaid"));
    } catch (e) {
      console.error("Erro ao marcar conta como paga:", e);
      setErro(t("contasReceber.errorMarkingPaid"));
    }
  };

  const handleRemoverConta = async (id) => {
    const confirmar = window.confirm(t("contasReceber.confirmDelete"));
    if (!confirmar) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/contas-receber/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const dados = await resp.json();

      if (!resp.ok || !dados.sucesso) {
        setContas(prev => prev.filter(c => c.id !== id));
        localStorage.setItem('contasReceber', JSON.stringify(contas.filter(c => c.id !== id)));
        setSucesso(t("contasReceber.deletedLocally"));
        return;
      }

      setContas(prev => prev.filter(c => c.id !== id));
      localStorage.setItem('contasReceber', JSON.stringify(contas.filter(c => c.id !== id)));
      setSucesso(t("contasReceber.deletedSuccess"));
    } catch (e) {
      console.error("Erro ao remover conta:", e);
      setContas(prev => prev.filter(c => c.id !== id));
      localStorage.setItem('contasReceber', JSON.stringify(contas.filter(c => c.id !== id)));
      setSucesso(t("contasReceber.deletedLocally"));
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
        <div className="cr-container">
          <div className="cr-card">
            <header className="cr-header">
              <h1>{t("contasReceber.title")}</h1>
              <p className="subtitle">{t("contasReceber.subtitle")}</p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}
            {sucesso && <p className="sucesso-msg">{sucesso}</p>}

            <div className="cr-resumo-card">
              <div className="cr-resumo-item">
                <span style={{ fontSize: 24, fontWeight: 'bold', display: 'inline-block' }}>
                  {getCurrencySymbol()}
                </span>
                <div>
                  <p className="cr-resumo-label">{t("contasReceber.totalLabel")}</p>
                  {/* total é somatório convertido p/ moeda atual -> formatMoney */}
                  <p className="cr-resumo-valor">
                    {formatMoney(totalAberto)}
                  </p>
                </div>
              </div>
              <div className="cr-resumo-item-secundario">
                <CalendarClock size={20} />
                <p className="cr-resumo-secundario-label">
                  {t("contasReceber.countLabel", { count: contas.filter(c => c.status === "pendente").length })}
                </p>
              </div>
            </div>

            <button className="cr-btn-nova" onClick={() => setModalAberto(true)}>
              <Plus size={20} /> {t("contasReceber.newButton")}
            </button>

            <section className="cr-grafico-section">
              <h2>{t("contasReceber.chartTitle")}</h2>
              <div className="cr-grafico-container">
                {carregando ? (
                  <div className="cr-grafico-vazio"><p>{t("contasReceber.loadingChart")}</p></div>
                ) : dadosGrafico.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="nome" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        labelStyle={{ color: "#f8fafc" }}
                        formatter={(value) => [formatMoney(value), t("contasReceber.chartValueLabel")]}
                      />
                      <Bar dataKey="valor" fill="#22c55e" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="cr-grafico-vazio"><p>{t("contasReceber.noDataChart")}</p></div>
                )}
              </div>
            </section>

            <section className="cr-lista">
              <h2>{t("contasReceber.listTitle")}</h2>
              <div className="cr-lista-container">
                {carregando ? (
                  <div className="cr-lista-vazia"><p>{t("contasReceber.loadingList")}</p></div>
                ) : contas.length > 0 ? (
                  contas.map(conta => {
                    const isPendente = conta.status === "pendente";
                    const isPago = conta.status === "pago";

                    let vencimentoDate = null;
                    let vencimentoFormatado = "-";
                    if (conta.vencimento) {
                      const raw = conta.vencimento.length === 10 ? conta.vencimento + "T00:00:00" : conta.vencimento;
                      vencimentoDate = new Date(raw);
                      vencimentoFormatado = vencimentoDate.toLocaleDateString("pt-BR");
                    }

                    const hoje = new Date();
                    const hojeSoData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                    const isAtrasado = isPendente && vencimentoDate && vencimentoDate < hojeSoData;

                    let statusLabel = "";
                    let statusClass = "";
                    if (isPago) {
                      statusLabel = t("contasReceber.statusPaid");
                      statusClass = "cr-status pago";
                    } else if (isAtrasado) {
                      statusLabel = t("contasReceber.statusLate");
                      statusClass = "cr-status atrasado";
                    } else if (isPendente) {
                      statusLabel = t("contasReceber.statusPending");
                      statusClass = "cr-status pendente";
                    }

                    return (
                      <div key={conta.id} className="cr-item">
                        <div className="cr-info">
                          <h3>
                            {conta.cliente}{" "}
                            {statusLabel && <span className={statusClass}>{statusLabel}</span>}
                          </h3>
                          <p className="cr-data">{t("contasReceber.dueDate")}: {vencimentoFormatado}</p>
                          {conta.descricao && <p className="cr-descricao">{conta.descricao}</p>}
                        </div>
                        <div className="cr-acoes">
                          <div className="cr-valor-e-remover">
                            <p className="cr-valor">
                              {/* item exibido na SUA PRÓPRIA moeda, sem reconverter */}
                              <Money value={conta.valor} moeda={conta.moeda} />
                            </p>
                            {isPendente && (
                              <button className="cr-btn-editar" onClick={() => abrirModalEdicao(conta)} title={t("contasReceber.editTitle")}>
                                <Pencil size={16} />
                              </button>
                            )}
                            <button className="cr-btn-remover" onClick={() => handleRemoverConta(conta.id)} title={t("contasReceber.deleteTitle")}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {isPendente && (
                            <button className="cr-btn-acao" onClick={() => handleMarcarComoPaga(conta.id)}>
                              {t("contasReceber.markAsPaid")}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="cr-lista-vazia"><p>{t("contasReceber.noDataList")}</p></div>
                )}
              </div>
            </section>
          </div>

          {/* Modal de criação */}
          {modalAberto && (
            <div className="modal-overlay" onClick={() => setModalAberto(false)}>
              <div className="modal-conteudo" onClick={e => e.stopPropagation()}>
                <button className="modal-fechar" onClick={() => setModalAberto(false)}><X size={24} /></button>
                <h2>{t("contasReceber.modalCreate")}</h2>
                <form className="cr-form" onSubmit={handleAdicionarConta}>
                  <div className="form-group">
                    <label htmlFor="cliente">{t("contasReceber.formName")}</label>
                    <input type="text" id="cliente" name="cliente" placeholder={t("contasReceber.formNamePlaceholder")} autoComplete="off" value={novaConta.cliente} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="valor">{t("contasReceber.formValue")}</label>
                    <input type="number" id="valor" name="valor" placeholder="0.00" step="0.01" min="0" autoComplete="off" value={novaConta.valor} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="vencimento">{t("contasReceber.formDueDate")}</label>
                    <input type="date" id="vencimento" name="vencimento" autoComplete="off" value={novaConta.vencimento} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="descricao">{t("contasReceber.formDescription")}</label>
                    <input type="text" id="descricao" name="descricao" placeholder={t("contasReceber.formDescriptionPlaceholder")} autoComplete="off" value={novaConta.descricao} onChange={handleInputChange} />
                  </div>
                  <button type="submit" className="btn-salvar">{t("contasReceber.saveButton")}</button>
                </form>
              </div>
            </div>
          )}

          {/* Modal de edição */}
          {modalEdicaoAberto && contaEditando && (
            <div className="modal-overlay" onClick={fecharModalEdicao}>
              <div className="modal-conteudo" onClick={e => e.stopPropagation()}>
                <button className="modal-fechar" onClick={fecharModalEdicao}><X size={24} /></button>
                <h2>{t("contasReceber.modalEdit")}</h2>
                <form className="cr-form" onSubmit={handleEditarConta}>
                  <div className="form-group">
                    <label htmlFor="edit-cliente">{t("contasReceber.formName")}</label>
                    <input type="text" id="edit-cliente" name="cliente" autoComplete="off" value={contaEditando.cliente} onChange={handleEdicaoChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-valor">{t("contasReceber.formValue")}</label>
                    <input type="number" id="edit-valor" name="valor" step="0.01" min="0" autoComplete="off" value={contaEditando.valor} onChange={handleEdicaoChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-vencimento">{t("contasReceber.formDueDate")}</label>
                    <input type="date" id="edit-vencimento" name="vencimento" autoComplete="off" value={contaEditando.vencimento} onChange={handleEdicaoChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-descricao">{t("contasReceber.formDescription")}</label>
                    <input type="text" id="edit-descricao" name="descricao" autoComplete="off" value={contaEditando.descricao} onChange={handleEdicaoChange} />
                  </div>
                  <button type="submit" className="btn-salvar">{t("contasReceber.saveEditButton")}</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ContasReceber;