import React, { useState, useEffect } from "react";
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

  // Carregar contas a pagar do backend
  useEffect(() => {
    async function carregarContas() {
      try {
        setCarregando(true);
        setErro("");

        const resp = await fetch("http://localhost:3000/api/contas-pagar");

        if (!resp.ok) {
          throw new Error("Erro ao buscar contas a pagar");
        }

        const dados = await resp.json();
        const normalizadas = (dados || []).map((c) => ({
          ...c,
          valor: Number(c.valor) || 0,
        }));
        setContas(normalizadas);
      } catch (e) {
        console.error("Erro ao carregar contas a pagar:", e);
        setErro("Não foi possível carregar as contas a pagar.");
      } finally {
        setCarregando(false);
      }
    }

    carregarContas();
  }, []);

  // Dados do gráfico: só pendentes
  const dadosGrafico = contas
    .filter((c) => c.status === "pendente")
    .map((c) => ({
      nome: c.titulo,
      valor: Number(c.valor) || 0,
    }));

  // Total em aberto (somente pendentes)
  const totalPagar = contas
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
    if (!novaConta.titulo || !novaConta.valor || !novaConta.vencimento) {
      alert("Preencha título, valor e vencimento!");
      return;
    }

    try {
      setErro("");

      const valorNumero = parseFloat(novaConta.valor);

      const body = {
        titulo: novaConta.titulo,
        tipo: novaConta.tipo,
        valor: valorNumero,
        // backend salva como string YYYY-MM-DD
        vencimento: novaConta.vencimento,
        descricao: novaConta.descricao,
      };

      const resp = await fetch("http://localhost:3000/api/contas-pagar", {
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
        titulo: "",
        tipo: "",
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

  // Marcar como paga -> /api/contas-pagar/:id/pagar
  const handleMarcarComoPaga = async (id) => {
    try {
      const resp = await fetch(
        `http://localhost:3000/api/contas-pagar/${id}/pagar`,
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

  // remover conta a pagar -> DELETE /api/contas-pagar/:id
  const handleRemoverConta = async (id) => {
    const confirmar = window.confirm(
      "Tem certeza que deseja remover esta conta a pagar?"
    );
    if (!confirmar) return;

    try {
      const resp = await fetch(
        `http://localhost:3000/api/contas-pagar/${id}`,
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
        <div className="cp-container">
          <div className="cp-card">
            <header className="cp-header">
              <h1>
                <CreditCard size={32} />
                Contas a Pagar
              </h1>
              <p className="subtitle">
                Controle suas contas pendentes para pagar
              </p>
            </header>

            {erro && (
              <p style={{ color: "#f97316", marginBottom: "10px" }}>
                {erro}
              </p>
            )}

            <div className="cp-resumo-card">
              <div className="cp-resumo-item">
                <AlertTriangle size={24} />
                <div>
                  <p className="cp-resumo-label">Total em Aberto</p>
                  <p className="cp-resumo-valor">
                    R{"$ "}
                    {totalPagar.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="cp-resumo-item-secundario">
                <CalendarClock size={20} />
                <p className="cp-resumo-secundario-label">
                  {contas.filter((c) => c.status === "pendente").length}{" "}
                  conta(s) pendente(s)
                </p>
              </div>
            </div>

            <button
              className="cp-btn-nova"
              onClick={() => setModalAberto(true)}
            >
              <Plus size={20} />
              Nova Conta a Pagar
            </button>

            <section className="cp-grafico-section">
              <h2>Contas por Título (pendentes)</h2>
              <div className="cp-grafico-container">
                {carregando ? (
                  <div className="cp-grafico-vazio">
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
                        fill="#f97316"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="cp-grafico-vazio">
                    <p>Não há contas pendentes</p>
                  </div>
                )}
              </div>
            </section>

            <section className="cp-lista">
              <h2>Lista de Contas a Pagar</h2>
              <div className="cp-lista-container">
                {carregando ? (
                  <div className="cp-lista-vazia">
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
                      statusClass = "cp-status pago";
                    } else if (isAtrasado) {
                      statusLabel = "Não pago, pague o quanto antes!";
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
                            {statusLabel && (
                              <span className={statusClass}>
                                {statusLabel}
                              </span>
                            )}
                          </h3>
                          <p className="cp-data">
                            Vencimento: {vencimentoFormatado}
                          </p>
                          {conta.tipo && (
                            <p className="cp-data">Tipo: {conta.tipo}</p>
                          )}
                          {conta.descricao && (
                            <p className="cp-data">{conta.descricao}</p>
                          )}
                        </div>
                        <div className="cp-acoes">
                          <div className="cp-valor-e-remover">
                            <p className="cp-valor">
                              R{"$ "}
                              {Number(conta.valor || 0).toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}
                            </p>
                            <button
                              className="cp-btn-remover"
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
                              className="cp-btn-acao"
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
                  <div className="cp-lista-vazia">
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
                <h2>Nova Conta a Pagar</h2>
                <form className="cp-form" onSubmit={handleAdicionarConta}>
                  <div className="form-group">
                    <label htmlFor="titulo">Título da conta</label>
                    <input
                      type="text"
                      id="titulo"
                      name="titulo"
                      placeholder="Ex: Luz, Internet, Pix fulano..."
                      value={novaConta.titulo}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tipo">Tipo (opcional)</label>
                    <input
                      type="text"
                      id="tipo"
                      name="tipo"
                      placeholder="Ex: fixa, variável, empréstimo..."
                      value={novaConta.tipo}
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
                    <label htmlFor="descricao">
                      Descrição (opcional)
                    </label>
                    <input
                      type="text"
                      id="descricao"
                      name="descricao"
                      placeholder="Ex: conta de casa, dinheiro devendo..."
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

export default ContasPagar;