import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./ContasReceber.css";
import {
  Plus,
  X,
  WalletCards,
  CalendarClock,
  BadgeDollarSign,
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

function ContasReceber() {
  const [modalAberto, setModalAberto] = useState(false);
  const [contas, setContas] = useState([]);
  const [novaConta, setNovaConta] = useState({
    cliente: "",
    valor: "",
    vencimento: "",
    descricao: "",
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Carregar contas a receber do backend
  useEffect(() => {
    async function carregarContas() {
      try {
        setCarregando(true);
        setErro("");

        const resp = await fetch("http://localhost:3000/api/contas-receber");

        if (!resp.ok) {
          throw new Error("Erro ao buscar contas a receber");
        }

        const dados = await resp.json();
        // garante tipos corretos
        const normalizadas = (dados || []).map((c) => ({
          ...c,
          valor: Number(c.valor) || 0,
        }));
        setContas(normalizadas);
      } catch (e) {
        console.error("Erro ao carregar contas a receber:", e);
        setErro("Não foi possível carregar as contas a receber.");
      } finally {
        setCarregando(false);
      }
    }

    carregarContas();
  }, []);

  const dadosGrafico = contas
    .filter((c) => c.status === "pendente")
    .map((c) => ({
      nome: c.cliente,
      valor: Number(c.valor) || 0,
    }));

  const totalAberto = contas
    .filter((c) => c.status === "pendente")
    .reduce((acc, c) => acc + (Number(c.valor) || 0), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaConta((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdicionarConta = async (e) => {
    e.preventDefault();
    if (
      !novaConta.cliente ||
      !novaConta.valor ||
      !novaConta.vencimento
    ) {
      alert("Preencha cliente, valor e vencimento!");
      return;
    }

    try {
      setErro("");

      const body = {
        cliente: novaConta.cliente,
        valor: parseFloat(novaConta.valor),
        // backend salva como string YYYY-MM-DD
        vencimento: novaConta.vencimento,
        descricao: novaConta.descricao,
      };

      const resp = await fetch("http://localhost:3000/api/contas-receber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        throw new Error("Erro ao salvar conta");
      }

      const criada = await resp.json();

      setContas((prev) => [
        ...prev,
        { ...criada, valor: Number(criada.valor) || 0 },
      ]);

      setNovaConta({
        cliente: "",
        valor: "",
        vencimento: "",
        descricao: "",
      });
      setModalAberto(false);
    } catch (e) {
      console.error("Erro ao salvar conta:", e);
      alert("Não foi possível salvar a conta. Tente novamente.");
    }
  };

  // marcar como paga -> chama /api/contas-receber/:id/pagar
  const handleMarcarComoPaga = async (id) => {
    try {
      const resp = await fetch(
        `http://localhost:3000/api/contas-receber/${id}/pagar`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!resp.ok) {
        throw new Error("Erro ao marcar como paga");
      }

      const { conta } = await resp.json();

      setContas((prev) =>
        prev.map((c) =>
          c.id === conta.id ? { ...conta, valor: Number(conta.valor) || 0 } : c
        )
      );
    } catch (e) {
      console.error("Erro ao marcar conta como paga:", e);
      alert("Não foi possível marcar como paga.");
    }
  };

  // (pode ser usada no futuro)
  const handleCobrar = async (id) => {
    try {
      const resp = await fetch(
        `http://localhost:3000/api/contas-receber/${id}/cobrar`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!resp.ok) {
        throw new Error("Erro ao enviar cobrança");
      }

      const contaAtualizada = await resp.json();

      setContas((prev) =>
        prev.map((c) =>
          c.id === contaAtualizada.id
            ? { ...contaAtualizada, valor: Number(contaAtualizada.valor) || 0 }
            : c
        )
      );
    } catch (e) {
      console.error("Erro ao cobrar conta:", e);
      alert("Não foi possível registrar a cobrança.");
    }
  };

  // remover conta a receber
  const handleRemoverConta = async (id) => {
    const confirmar = window.confirm(
      "Tem certeza que deseja remover esta conta a receber?"
    );
    if (!confirmar) return;

    try {
      const resp = await fetch(
        `http://localhost:3000/api/contas-receber/${id}`,
        { method: "DELETE" }
      );

      const dados = await resp.json();

      if (!resp.ok || !dados.sucesso) {
        setErro(dados.erro || "Não foi possível remover a conta.");
        return;
      }

      setContas((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error("Erro ao remover conta:", e);
      setErro("Não foi possível remover a conta.");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "20px" }}>
        <div className="cr-container">
          <div className="cr-card">
            <header className="cr-header">
              <h1>
                <WalletCards size={32} />
                Contas a Receber
              </h1>
              <p className="subtitle">
                Controle seus recebimentos pendentes
              </p>
            </header>

            {erro && (
              <p style={{ color: "#f97316", marginBottom: "10px" }}>
                {erro}
              </p>
            )}

            <div className="cr-resumo-card">
              <div className="cr-resumo-item">
                <BadgeDollarSign size={24} />
                <div>
                  <p className="cr-resumo-label">Total em Aberto</p>
                  <p className="cr-resumo-valor">
                    R{"$ "}
                    {totalAberto.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="cr-resumo-item-secundario">
                <CalendarClock size={20} />
                <p className="cr-resumo-secundario-label">
                  {
                    contas.filter((c) => c.status === "pendente")
                      .length
                  }{" "}
                  contas pendentes
                </p>
              </div>
            </div>

            <button
              className="cr-btn-nova"
              onClick={() => setModalAberto(true)}
            >
              <Plus size={20} />
              Nova Conta a Receber
            </button>

            <section className="cr-grafico-section">
              <h2>Contas por Cliente (pendentes)</h2>
              <div className="cr-grafico-container">
                {carregando ? (
                  <div className="cr-grafico-vazio">
                    <p>Carregando contas...</p>
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
                          "R$ " +
                            Number(value).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            }),
                          "Valor",
                        ]}
                      />
                      <Bar
                        dataKey="valor"
                        fill="#22c55e"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="cr-grafico-vazio">
                    <p>Não há contas pendentes</p>
                  </div>
                )}
              </div>
            </section>

            <section className="cr-lista">
              <h2>Lista de Contas a Receber</h2>
              <div className="cr-lista-container">
                {carregando ? (
                  <div className="cr-lista-vazia">
                    <p>Carregando contas...</p>
                  </div>
                ) : contas.length > 0 ? (
                  contas.map((conta) => {
                    const isPendente = conta.status === "pendente";
                    const isPago = conta.status === "pago";

                    // trata vencimento como "YYYY-MM-DD" -> local T00:00:00
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
                      statusLabel = "Pago";
                      statusClass = "cr-status pago";
                    } else if (isAtrasado) {
                      statusLabel = "Não pago, faça a cobrança!";
                      statusClass = "cr-status atrasado";
                    } else if (isPendente) {
                      statusLabel = "Pendente";
                      statusClass = "cr-status pendente";
                    }

                    let ultimaCobrancaFormatada = null;
                    if (conta.dataUltimaCobranca) {
                      const raw =
                        conta.dataUltimaCobranca.length === 10
                          ? conta.dataUltimaCobranca + "T00:00:00"
                          : conta.dataUltimaCobranca;
                      ultimaCobrancaFormatada = new Date(
                        raw
                      ).toLocaleDateString("pt-BR");
                    }

                    return (
                      <div key={conta.id} className="cr-item">
                        <div className="cr-info">
                          <h3>
                            {conta.cliente}{" "}
                            {statusLabel && (
                              <span className={statusClass}>
                                {statusLabel}
                              </span>
                            )}
                          </h3>
                          <p className="cr-data">
                            Vencimento: {vencimentoFormatado}
                          </p>
                          {ultimaCobrancaFormatada && (
                            <p className="cr-data">
                              Última cobrança: {ultimaCobrancaFormatada}
                            </p>
                          )}
                          {conta.descricao && (
                            <p className="cr-descricao">
                              {conta.descricao}
                            </p>
                          )}
                        </div>
                        <div className="cr-acoes">
                          <div className="cr-valor-e-remover">
                            <p className="cr-valor">
                              R{"$ "}
                              {Number(conta.valor || 0).toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}
                            </p>
                            <button
                              className="cr-btn-remover"
                              onClick={() =>
                                handleRemoverConta(conta.id)
                              }
                              title="Remover conta"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {isPendente && (
                            <button
                              className="cr-btn-acao"
                              onClick={() =>
                                handleMarcarComoPaga(conta.id)
                              }
                            >
                              Marcar como paga
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="cr-lista-vazia">
                    <p>Nenhuma conta cadastrada</p>
                  </div>
                )}
              </div>
            </section>
          </div>

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
                <h2>Nova Conta a Receber</h2>
                <form className="cr-form" onSubmit={handleAdicionarConta}>
                  <div className="form-group">
                    <label htmlFor="cliente">Cliente</label>
                    <input
                      type="text"
                      id="cliente"
                      name="cliente"
                      placeholder="Nome do cliente"
                      value={novaConta.cliente}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="valor">Valor (R$)</label>
                    <input
                      type="number"
                      id="valor"
                      name="valor"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={novaConta.valor}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="vencimento">Vencimento</label>
                    <input
                      type="date"
                      id="vencimento"
                      name="vencimento"
                      value={novaConta.vencimento}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="descricao">Descrição (opcional)</label>
                    <input
                      type="text"
                      id="descricao"
                      name="descricao"
                      placeholder="Ex: Empréstimo para amigo X"
                      value={novaConta.descricao}
                      onChange={handleInputChange}
                    />
                  </div>
                  <button type="submit" className="btn-salvar">
                    Salvar Conta
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

export default ContasReceber;