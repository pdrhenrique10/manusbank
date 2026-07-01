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

// 🔥 Importação do sistema de moeda
import { useCurrency } from "../../context/CurrencyProvider";

// 🔥 Componente de Moeda local (puxa a função do Provider)
function Money({ value }) {
  const { formatMoney } = useCurrency();
  return <span>{formatMoney(value)}</span>;
}

function ContasReceber() {
  const navigate = useNavigate();
  
  // 🔥 Puxa TUDO do provider
  const { 
    formatMoney, 
    convertToBRL, 
    currency, 
    setCurrency, 
    getCurrencySymbol 
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

  // Verificar autenticação e carregar contas
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
        // Fallback: carregar do localStorage
        const contasLocal = JSON.parse(localStorage.getItem('contasReceber') || '[]');
        setContas(contasLocal);
        setCarregando(false);
        return;
      }

      const dados = await resp.json();
      const normalizadas = (dados || []).map(c => ({
        ...c,
        valor: Number(c.valor) || 0,
      }));
      setContas(normalizadas);
      localStorage.setItem('contasReceber', JSON.stringify(normalizadas));
    } catch (e) {
      console.error("Erro ao carregar contas a receber:", e);
      const contasLocal = JSON.parse(localStorage.getItem('contasReceber') || '[]');
      setContas(contasLocal);
      setErro("Erro ao carregar contas. Usando dados locais.");
    } finally {
      setCarregando(false);
    }
  }

  // Limpar mensagens após 3 segundos
  useEffect(() => {
    if (sucesso) {
      const timer = setTimeout(() => setSucesso(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [sucesso]);

  const dadosGrafico = contas
    .filter(c => c.status === "pendente")
    .map(c => ({
      nome: c.cliente.length > 15 ? c.cliente.substring(0, 15) + "..." : c.cliente,
      valor: Number(c.valor) || 0,
    }));

  const totalAberto = contas
    .filter(c => c.status === "pendente")
    .reduce((acc, c) => acc + (Number(c.valor) || 0), 0);

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
      setErro("Preencha cliente, valor e vencimento!");
      return;
    }

    const valorDigitado = parseFloat(String(contaEditando.valor).replace(",", "."));
    if (isNaN(valorDigitado) || valorDigitado <= 0) {
      setErro("Informe um valor válido maior que zero.");
      return;
    }

    // 🔥 Converte para Real antes de salvar
    const valorEmReal = convertToBRL(valorDigitado);

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
          valor: valorEmReal,
          vencimento: contaEditando.vencimento,
          descricao: contaEditando.descricao,
        }),
      });

      const resultado = await resp.json();

      if (!resp.ok || !resultado.sucesso) {
        setErro(resultado.erro || "Não foi possível atualizar o ganho.");
        return;
      }

      const atualizada = { ...resultado.conta, valor: Number(resultado.conta.valor) || 0 };
      const contasAtualizadas = contas.map(c =>
        c.id === atualizada.id ? atualizada : c
      );
      setContas(contasAtualizadas);
      localStorage.setItem("contasReceber", JSON.stringify(contasAtualizadas));
      setSucesso("Ganho atualizado com sucesso!");
      fecharModalEdicao();
    } catch (err) {
      console.error("Erro ao editar conta:", err);
      setErro("Erro ao atualizar ganho. Tente novamente.");
    }
  };

  const handleAdicionarConta = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!novaConta.cliente || !novaConta.valor || !novaConta.vencimento) {
      setErro("Preencha cliente, valor e vencimento!");
      return;
    }

    const valorDigitado = parseFloat(String(novaConta.valor).replace(",", "."));
    if (isNaN(valorDigitado) || valorDigitado <= 0) {
      setErro("Informe um valor válido maior que zero.");
      return;
    }

    // 🔥 Converte para Real antes de salvar
    const valorEmReal = convertToBRL(valorDigitado);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const novaContaObj = {
      id: Date.now(),
      cliente: novaConta.cliente,
      valor: valorEmReal,
      vencimento: novaConta.vencimento,
      descricao: novaConta.descricao,
      status: "pendente",
    };

    try {
      const body = {
        cliente: novaConta.cliente,
        valor: valorEmReal,
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
        // Fallback local
        setContas(prev => [...prev, novaContaObj]);
        const contasAtualizadas = [...contas, novaContaObj];
        localStorage.setItem('contasReceber', JSON.stringify(contasAtualizadas));
        setSucesso("Conta salva localmente!");
        setModalAberto(false);
        setNovaConta({ cliente: "", valor: "", vencimento: "", descricao: "" });
        return;
      }

      const criada = await resp.json();
      const contaComValor = { ...criada, valor: Number(criada.valor) || 0 };
      setContas(prev => [...prev, contaComValor]);
      const contasAtualizadas = [...contas, contaComValor];
      localStorage.setItem('contasReceber', JSON.stringify(contasAtualizadas));
      setNovaConta({ cliente: "", valor: "", vencimento: "", descricao: "" });
      setModalAberto(false);
      setSucesso("Conta adicionada com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar conta:", e);
      setContas(prev => [...prev, novaContaObj]);
      const contasAtualizadas = [...contas, novaContaObj];
      localStorage.setItem('contasReceber', JSON.stringify(contasAtualizadas));
      setSucesso("Conta salva localmente (offline)!");
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
        // Fallback local
        setContas(prev =>
          prev.map(c => (c.id === id ? { ...c, status: "pago" } : c))
        );
        const contasAtualizadas = contas.map(c =>
          c.id === id ? { ...c, status: "pago" } : c
        );
        localStorage.setItem('contasReceber', JSON.stringify(contasAtualizadas));
        setSucesso("Conta marcada como paga localmente!");
        return;
      }

      const { conta } = await resp.json();
      setContas(prev =>
        prev.map(c => (c.id === conta.id ? { ...conta, valor: Number(conta.valor) || 0 } : c))
      );
      const contasAtualizadas = contas.map(c =>
        c.id === conta.id ? { ...conta, valor: Number(conta.valor) || 0 } : c
      );
      localStorage.setItem('contasReceber', JSON.stringify(contasAtualizadas));
      setSucesso("Conta marcada como paga!");
    } catch (e) {
      console.error("Erro ao marcar conta como paga:", e);
      setErro("Não foi possível marcar como paga.");
    }
  };

  const handleRemoverConta = async (id) => {
    const confirmar = window.confirm("Tem certeza que deseja remover esta conta a receber?");
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
        // Fallback local
        setContas(prev => prev.filter(c => c.id !== id));
        const contasAtualizadas = contas.filter(c => c.id !== id);
        localStorage.setItem('contasReceber', JSON.stringify(contasAtualizadas));
        setSucesso("Conta removida localmente!");
        return;
      }

      setContas(prev => prev.filter(c => c.id !== id));
      const contasAtualizadas = contas.filter(c => c.id !== id);
      localStorage.setItem('contasReceber', JSON.stringify(contasAtualizadas));
      setSucesso("Conta removida com sucesso!");
    } catch (e) {
      console.error("Erro ao remover conta:", e);
      setContas(prev => prev.filter(c => c.id !== id));
      const contasAtualizadas = contas.filter(c => c.id !== id);
      localStorage.setItem('contasReceber', JSON.stringify(contasAtualizadas));
      setSucesso("Conta removida localmente!");
    }
  };

  if (carregando) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "20px" }}>Carregando...</main>
      </div>
    );
  }

  // Controle para esconder sidebar no mobile quando o modal estiver aberto
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
              <h1>
                Ganhos não-fixos
              </h1>
              <p className="subtitle">Controle o dinheiro que você recebe de rendas a parte.</p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}
            {sucesso && <p className="sucesso-msg">{sucesso}</p>}

            <div className="cr-resumo-card">
              <div className="cr-resumo-item">
                {/* 🔥 Símbolo puxado do Provider */}
                <span style={{ fontSize: 24, fontWeight: 'bold', display: 'inline-block' }}>
                  {getCurrencySymbol()}
                </span>
                <div>
                  <p className="cr-resumo-label">Total em Aberto</p>
                  {/* 🔥 Substituído por <Money /> */}
                  <p className="cr-resumo-valor">
                    <Money value={totalAberto} />
                  </p>
                </div>
              </div>
              <div className="cr-resumo-item-secundario">
                <CalendarClock size={20} />
                <p className="cr-resumo-secundario-label">
                  {contas.filter(c => c.status === "pendente").length} ganhos pendentes
                </p>
              </div>
            </div>

            <button className="cr-btn-nova" onClick={() => setModalAberto(true)}>
              <Plus size={20} /> Novo Ganho
            </button>

            <section className="cr-grafico-section">
              <h2>Ganhos cadastrados</h2>
              <div className="cr-grafico-container">
                {carregando ? (
                  <div className="cr-grafico-vazio"><p>Carregando ganhos...</p></div>
                ) : dadosGrafico.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="nome" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        labelStyle={{ color: "#f8fafc" }}
                        // 🔥 Formatter usando o Provider
                        formatter={(value) => [formatMoney(value), "Valor"]}
                      />
                      <Bar dataKey="valor" fill="#22c55e" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="cr-grafico-vazio"><p>Não há ganhos pendentes</p></div>
                )}
              </div>
            </section>

            <section className="cr-lista">
              <h2>Lista de ganhos registrados</h2>
              <div className="cr-lista-container">
                {carregando ? (
                  <div className="cr-lista-vazia"><p>Carregando ganhos...</p></div>
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
                      statusLabel = "Pago";
                      statusClass = "cr-status pago";
                    } else if (isAtrasado) {
                      statusLabel = "Atrasado";
                      statusClass = "cr-status atrasado";
                    } else if (isPendente) {
                      statusLabel = "Pendente";
                      statusClass = "cr-status pendente";
                    }

                    return (
                      <div key={conta.id} className="cr-item">
                        <div className="cr-info">
                          <h3>
                            {conta.cliente}{" "}
                            {statusLabel && <span className={statusClass}>{statusLabel}</span>}
                          </h3>
                          <p className="cr-data">Vencimento: {vencimentoFormatado}</p>
                          {conta.descricao && <p className="cr-descricao">{conta.descricao}</p>}
                        </div>
                        <div className="cr-acoes">
                          <div className="cr-valor-e-remover">
                            {/* 🔥 Substituído por <Money /> */}
                            <p className="cr-valor">
                              <Money value={conta.valor} />
                            </p>
                            {isPendente && (
                              <button className="cr-btn-editar" onClick={() => abrirModalEdicao(conta)} title="Editar ganho">
                                <Pencil size={16} />
                              </button>
                            )}
                            <button className="cr-btn-remover" onClick={() => handleRemoverConta(conta.id)} title="Remover conta">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {isPendente && (
                            <button className="cr-btn-acao" onClick={() => handleMarcarComoPaga(conta.id)}>
                              Marcar como recebido
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="cr-lista-vazia"><p>Nenhum ganho cadastrado</p></div>
                )}
              </div>
            </section>
          </div>

          {/* Modal de criação */}
          {modalAberto && (
            <div className="modal-overlay" onClick={() => setModalAberto(false)}>
              <div className="modal-conteudo" onClick={e => e.stopPropagation()}>
                <button className="modal-fechar" onClick={() => setModalAberto(false)}><X size={24} /></button>
                <h2>Novo Ganho</h2>
                <form className="cr-form" onSubmit={handleAdicionarConta}>
                  <div className="form-group">
                    <label htmlFor="cliente">Nome</label>
                    <input type="text" id="cliente" name="cliente" placeholder="Ex: Alguém te devendo, venda de algo..." autocomplete="off" value={novaConta.cliente} onChange={handleInputChange} />
                  </div>
                  
                  {/* 🔥 SELETOR DE MOEDA */}
                  <div className="form-group">
                    <label htmlFor="moeda">Moeda da transação</label>
                    <select
                      id="moeda"
                      className="currency-select"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="BRL">🇧🇷 Real (R$)</option>
                      <option value="USD">🇺🇸 Dólar ($)</option>
                      <option value="EUR">🇪🇺 Euro (€)</option>
                      <option value="GBP">🇬🇧 Libra (£)</option>
                    </select>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      O valor será convertido e salvo em Real (BRL) no sistema.
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="valor">Valor</label>
                    <input type="number" id="valor" name="valor" placeholder="0.00" step="0.01" min="0" autoComplete="off" value={novaConta.valor} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="vencimento">Dia do pagamento</label>
                    <input type="date" id="vencimento" name="vencimento" autocomplete="off" value={novaConta.vencimento} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="descricao">Descrição (opcional)</label>
                    <input type="text" id="descricao" name="descricao" placeholder="Vendi um video-game, recebi um dinheiro..." autocomplete="off" value={novaConta.descricao} onChange={handleInputChange} />
                  </div>
                  <button type="submit" className="btn-salvar">Salvar</button>
                </form>
              </div>
            </div>
          )}

          {/* Modal de edição */}
          {modalEdicaoAberto && contaEditando && (
            <div className="modal-overlay" onClick={fecharModalEdicao}>
              <div className="modal-conteudo" onClick={e => e.stopPropagation()}>
                <button className="modal-fechar" onClick={fecharModalEdicao}><X size={24} /></button>
                <h2>Editar Ganho</h2>
                <form className="cr-form" onSubmit={handleEditarConta}>
                  <div className="form-group">
                    <label htmlFor="edit-cliente">Nome</label>
                    <input type="text" id="edit-cliente" name="cliente" autoComplete="off" value={contaEditando.cliente} onChange={handleEdicaoChange} />
                  </div>

                  {/* 🔥 SELETOR DE MOEDA NO MODAL DE EDIÇÃO */}
                  <div className="form-group">
                    <label htmlFor="edit-moeda">Moeda da transação</label>
                    <select
                      id="edit-moeda"
                      className="currency-select"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="BRL">🇧🇷 Real (R$)</option>
                      <option value="USD">🇺🇸 Dólar ($)</option>
                      <option value="EUR">🇪🇺 Euro (€)</option>
                      <option value="GBP">🇬🇧 Libra (£)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-valor">Valor</label>
                    <input type="number" id="edit-valor" name="valor" step="0.01" min="0" autoComplete="off" value={contaEditando.valor} onChange={handleEdicaoChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-vencimento">Dia do pagamento</label>
                    <input type="date" id="edit-vencimento" name="vencimento" autoComplete="off" value={contaEditando.vencimento} onChange={handleEdicaoChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-descricao">Descrição (opcional)</label>
                    <input type="text" id="edit-descricao" name="descricao" autoComplete="off" value={contaEditando.descricao} onChange={handleEdicaoChange} />
                  </div>
                  <button type="submit" className="btn-salvar">Salvar Alterações</button>
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