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

function ContasPagar() {
  const navigate = useNavigate();
  const [modalAberto, setModalAberto] = useState(false);
  const [contas, setContas] = useState([]);
  const [novaConta, setNovaConta] = useState({
    titulo: "",
    tipo: "",
    valor: "",
    vencimento: "",
    descricao: "",
  });
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

      const resp = await fetch("http://localhost:3000/api/contas-pagar", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resp.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!resp.ok) {
        // Fallback: carregar do localStorage
        const contasLocal = JSON.parse(localStorage.getItem('contasPagar') || '[]');
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
      localStorage.setItem('contasPagar', JSON.stringify(normalizadas));
    } catch (e) {
      console.error("Erro ao carregar contas a pagar:", e);
      const contasLocal = JSON.parse(localStorage.getItem('contasPagar') || '[]');
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

  // Dados do gráfico: só pendentes
  const dadosGrafico = contas
    .filter(c => c.status === "pendente")
    .map(c => ({
      nome: c.titulo.length > 15 ? c.titulo.substring(0, 15) + "..." : c.titulo,
      valor: Number(c.valor) || 0,
    }));

  // Total em aberto (somente pendentes)
  const totalPagar = contas
    .filter(c => c.status === "pendente")
    .reduce((acc, c) => acc + (Number(c.valor) || 0), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaConta(prev => ({ ...prev, [name]: value }));
  };

  const handleAdicionarConta = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!novaConta.titulo || !novaConta.valor || !novaConta.vencimento) {
      setErro("Preencha título, valor e vencimento!");
      return;
    }

    const valorNumero = parseFloat(String(novaConta.valor).replace(",", "."));
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErro("Informe um valor válido maior que zero.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const novaContaObj = {
      id: Date.now(),
      titulo: novaConta.titulo,
      tipo: novaConta.tipo,
      valor: valorNumero,
      vencimento: novaConta.vencimento,
      descricao: novaConta.descricao,
      status: "pendente",
    };

    try {
      const body = {
        titulo: novaConta.titulo,
        tipo: novaConta.tipo,
        valor: valorNumero,
        vencimento: novaConta.vencimento,
        descricao: novaConta.descricao,
      };

      const resp = await fetch("http://localhost:3000/api/contas-pagar", {
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
        localStorage.setItem('contasPagar', JSON.stringify(contasAtualizadas));
        setSucesso("Conta salva localmente!");
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
      const contaComValor = { ...criada, valor: Number(criada.valor) || 0 };
      setContas(prev => [...prev, contaComValor]);
      const contasAtualizadas = [...contas, contaComValor];
      localStorage.setItem('contasPagar', JSON.stringify(contasAtualizadas));
      setNovaConta({
        titulo: "",
        tipo: "",
        valor: "",
        vencimento: "",
        descricao: "",
      });
      setModalAberto(false);
      setSucesso("Conta adicionada com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar conta:", e);
      setContas(prev => [...prev, novaContaObj]);
      const contasAtualizadas = [...contas, novaContaObj];
      localStorage.setItem('contasPagar', JSON.stringify(contasAtualizadas));
      setSucesso("Conta salva localmente (offline)!");
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
      const resp = await fetch(`http://localhost:3000/api/contas-pagar/${id}/pagar`, {
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
        localStorage.setItem('contasPagar', JSON.stringify(contasAtualizadas));
        setSucesso("Conta marcada como paga localmente!");
        return;
      }

      const { conta } = await resp.json();
      const contaAtualizada = { ...conta, valor: Number(conta.valor) || 0 };
      setContas(prev =>
        prev.map(c => (c.id === contaAtualizada.id ? contaAtualizada : c))
      );
      const contasAtualizadas = contas.map(c =>
        c.id === contaAtualizada.id ? contaAtualizada : c
      );
      localStorage.setItem('contasPagar', JSON.stringify(contasAtualizadas));
      setSucesso("Conta marcada como paga!");
    } catch (e) {
      console.error("Erro ao marcar conta como paga:", e);
      setErro("Não foi possível marcar como paga.");
    }
  };

  const handleRemoverConta = async (id) => {
    const confirmar = window.confirm("Tem certeza que deseja remover esta conta a pagar?");
    if (!confirmar) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`http://localhost:3000/api/contas-pagar/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const dados = await resp.json();

      if (!resp.ok || !dados.sucesso) {
        // Fallback local
        setContas(prev => prev.filter(c => c.id !== id));
        const contasAtualizadas = contas.filter(c => c.id !== id);
        localStorage.setItem('contasPagar', JSON.stringify(contasAtualizadas));
        setSucesso("Conta removida localmente!");
        return;
      }

      setContas(prev => prev.filter(c => c.id !== id));
      const contasAtualizadas = contas.filter(c => c.id !== id);
      localStorage.setItem('contasPagar', JSON.stringify(contasAtualizadas));
      setSucesso("Conta removida com sucesso!");
    } catch (e) {
      console.error("Erro ao remover conta:", e);
      setContas(prev => prev.filter(c => c.id !== id));
      const contasAtualizadas = contas.filter(c => c.id !== id);
      localStorage.setItem('contasPagar', JSON.stringify(contasAtualizadas));
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

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "20px" }}>
        <div className="cp-container">
          <div className="cp-card">
            <header className="cp-header">
              <h1>
                <CreditCard size={32} />
                Gastos não-fixos
              </h1>
              <p className="subtitle">
                Controle seus gastos imprevistos que surgem no dia-a-dia.
              </p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}
            {sucesso && <p className="sucesso-msg">{sucesso}</p>}

            <div className="cp-resumo-card">
              <div className="cp-resumo-item">
                <AlertTriangle size={24} />
                <div>
                  <p className="cp-resumo-label">Total em Aberto</p>
                  <p className="cp-resumo-valor">
                    R$ {totalPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="cp-resumo-item-secundario">
                <CalendarClock size={20} />
                <p className="cp-resumo-secundario-label">
                  {contas.filter(c => c.status === "pendente").length} conta(s) pendente(s)
                </p>
              </div>
            </div>

            <button className="cp-btn-nova" onClick={() => setModalAberto(true)}>
              <Plus size={20} /> Nova Conta a Pagar
            </button>

            <section className="cp-grafico-section">
              <h2>Contas por Título (pendentes)</h2>
              <div className="cp-grafico-container">
                {carregando ? (
                  <div className="cp-grafico-vazio"><p>Carregando contas...</p></div>
                ) : dadosGrafico.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="nome" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        labelStyle={{ color: "#f8fafc" }}
                        formatter={(value) => ["R$ " + Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 }), "Valor"]}
                      />
                      <Bar dataKey="valor" fill="#f97316" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="cp-grafico-vazio"><p>Não há contas pendentes</p></div>
                )}
              </div>
            </section>

            <section className="cp-lista">
              <h2>Lista de Contas a Pagar</h2>
              <div className="cp-lista-container">
                {carregando ? (
                  <div className="cp-lista-vazia"><p>Carregando contas...</p></div>
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
                      statusClass = "cp-status pago";
                    } else if (isAtrasado) {
                      statusLabel = "Atrasado";
                      statusClass = "cp-status atrasado";
                    } else if (isPendente) {
                      statusLabel = "Pendente";
                      statusClass = "cp-status pendente";
                    }

                    return (
                      <div key={conta.id} className="cp-item">
                        <div className="cp-info">
                          <h3>
                            {conta.titulo}{" "}
                            {statusLabel && <span className={statusClass}>{statusLabel}</span>}
                          </h3>
                          <p className="cp-data">Vencimento: {vencimentoFormatado}</p>
                          {conta.tipo && <p className="cp-data">Tipo: {conta.tipo}</p>}
                          {conta.descricao && <p className="cp-data">{conta.descricao}</p>}
                        </div>
                        <div className="cp-acoes">
                          <div className="cp-valor-e-remover">
                            <p className="cp-valor">
                              R$ {Number(conta.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                            <button
                              className="cp-btn-remover"
                              onClick={() => handleRemoverConta(conta.id)}
                              title="Remover conta"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {isPendente && (
                            <button
                              className="cp-btn-acao"
                              onClick={() => handleMarcarComoPaga(conta.id)}
                            >
                              Marcar como paga
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="cp-lista-vazia"><p>Nenhuma conta cadastrada</p></div>
                )}
              </div>
            </section>
          </div>

          {modalAberto && (
            <div className="modal-overlay" onClick={() => setModalAberto(false)}>
              <div className="modal-conteudo" onClick={e => e.stopPropagation()}>
                <button className="modal-fechar" onClick={() => setModalAberto(false)}><X size={24} /></button>
                <h2>Nova Gasto</h2>
                <form className="cp-form" onSubmit={handleAdicionarConta}>
                  <div className="form-group">
                    <label htmlFor="titulo">Nome</label>
                    <input type="text" id="titulo" name="titulo" placeholder="Ex: Pix de alguém, lanche/compra na rua, etc." autocomplete="off" value={novaConta.titulo} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tipo">Tipo (opcional)</label>
                    <input type="text" id="tipo" name="tipo" placeholder="Ex: fixa, variável, empréstimo..." autocomplete="off" value={novaConta.tipo} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="valor">Valor (R$)</label>
                    <input type="number" id="valor" name="valor" placeholder="0.00" step="0.01" min="0" autocomplete="off" value={novaConta.valor} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="vencimento">Vencimento</label>
                    <input type="date" id="vencimento" name="vencimento" autocomplete="off" value={novaConta.vencimento} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="descricao">Descrição (opcional)</label>
                    <input type="text" id="descricao" name="descricao" placeholder="Ex: conta de casa, dinheiro devendo..." autocomplete="off" value={novaConta.descricao} onChange={handleInputChange} />
                  </div>
                  <button type="submit" className="btn-salvar">Salvar Conta</button>
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