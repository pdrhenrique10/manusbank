import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Despesas.css";
import {
  Plus,
  X,
  Wallet,
  TrendingDown,
  CreditCard,
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

function extrairData(isoString) {
  if (!isoString) return new Date().toISOString().substring(0, 10);
  
  // Se já estiver no formato YYYY-MM-DD, retorna direto
  if (typeof isoString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    return isoString;
  }
  
  // Converte data ISO garantindo o fuso correto
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

function Despesas() {
  const [modalAberto, setModalAberto] = useState(false);
  const [despesas, setDespesas] = useState([]);
  const [novaDespesa, setNovaDespesa] = useState({
    nome: "",
    valor: "",
    data: new Date().toISOString().substring(0, 10),
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDespesas() {
      try {
        setCarregando(true);
        setErro("");

        const resp = await fetch("http://localhost:3000/api/dashboard");

        if (!resp.ok) {
          throw new Error("Erro ao buscar dashboard");
        }

        const dados = await resp.json();

        const todasTransacoes = dados.transacoes || [];

        const apenasDespesas = todasTransacoes
          .filter(
            (t) => t.tipo === "saque" || t.tipo === "transferenciaSaida"
          )
          .map((t) => ({
            id: t.id,
            nome: t.descricao || "Despesa",
            valor: Number(t.valor) || 0,
            data: extrairData(t.data),
          }));

        setDespesas(apenasDespesas);
      } catch (e) {
        console.error("Erro ao carregar despesas:", e);
        setErro("Não foi possível carregar as despesas.");
      } finally {
        setCarregando(false);
      }
    }

    carregarDespesas();
  }, []);

  const dadosGrafico = despesas.map((d) => ({
    nome: d.nome,
    valor: Number(d.valor) || 0,
  }));

  const totalDespesas = despesas.reduce(
    (acc, d) => acc + (Number(d.valor) || 0),
    0
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaDespesa((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdicionarDespesa = async (e) => {
    e.preventDefault();
    setErro("");

    if (!novaDespesa.nome || !novaDespesa.valor || !novaDespesa.data) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const valorNumero = parseFloat(novaDespesa.valor);
      
      // Garante que a data está no formato YYYY-MM-DD
      const dataFormatada = novaDespesa.data.substring(0, 10);

      const resp = await fetch("http://localhost:3000/api/transacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "saque",
          valor: valorNumero,
          descricao: novaDespesa.nome,
          data: dataFormatada,
          categoria: novaDespesa.nome,
        }),
      });

      const resultado = await resp.json();

      if (!resp.ok || !resultado.sucesso) {
        throw new Error(resultado.erro || "Erro ao salvar despesa");
      }

      const despesaLocal = {
        id: resultado.transacao?.id ?? Date.now(),
        nome: novaDespesa.nome,
        valor: valorNumero,
        data: dataFormatada,
      };

      setDespesas((prev) => [...prev, despesaLocal]);

      setNovaDespesa({ nome: "", valor: "", data: new Date().toISOString().substring(0, 10) });
      setModalAberto(false);
    } catch (e) {
      console.error("Erro ao salvar despesa:", e);
      alert("Não foi possível salvar a despesa. Tente novamente.");
    }
  };

  async function handleRemoverDespesa(id) {
    const confirmar = window.confirm(
      "Tem certeza que deseja remover esta despesa?"
    );
    if (!confirmar) return;

    try {
      const resp = await fetch(`http://localhost:3000/api/transacao/${id}`, {
        method: "DELETE",
      });

      const dados = await resp.json();

      if (!resp.ok || !dados.sucesso) {
        setErro(dados.erro || "Erro ao remover despesa.");
        return;
      }

      setDespesas((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error("Erro ao remover despesa:", e);
      setErro("Não foi possível remover a despesa.");
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "20px" }}>
        <div className="despesas-container">
          <div className="despesas-card">
            <header className="despesas-header">
              <h1>
                <Wallet size={32} />
                Despesas
              </h1>
              <p className="subtitle">Gerencie suas saídas de dinheiro</p>
            </header>

            {erro && (
              <p style={{ color: "#f97316", marginBottom: "10px" }}>{erro}</p>
            )}

            <div className="resumo-card">
              <div className="resumo-item">
                <CreditCard size={24} />
                <div>
                  <p className="resumo-label">Total de Despesas</p>
                  <p className="resumo-valor">
                    R{"$ "}
                    {totalDespesas.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="resumo-item-secundario">
                <TrendingDown size={20} />
                <p className="resumo-secundario-label">
                  {despesas.length} despesas cadastradas
                </p>
              </div>
            </div>

            <button
              className="btn-nova-despesa"
              onClick={() => setModalAberto(true)}
            >
              <Plus size={20} />
              Nova Despesa
            </button>

            <section className="grafico-section">
              <h2>Despesas por Categoria</h2>
              <div className="grafico-container">
                {carregando ? (
                  <div className="grafico-vazio">
                    <p>Carregando despesas...</p>
                  </div>
                ) : despesas.length > 0 ? (
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
                        fill="#ef4444"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grafico-vazio">
                    <p>Não há despesas cadastradas ainda</p>
                  </div>
                )}
              </div>
            </section>

            <section className="lista-despesas">
              <h2>Lista de Despesas</h2>
              <div className="lista-container">
                {carregando ? (
                  <div className="lista-vazia">
                    <p>Carregando despesas...</p>
                  </div>
                ) : despesas.length > 0 ? (
                  despesas.map((despesa) => {
                    const dataFormatada = formatarData(despesa.data);

                    return (
                      <div key={despesa.id} className="despesa-item">
                        <div className="despesa-info">
                          <h3>{despesa.nome}</h3>
                          <p className="despesa-data">{dataFormatada}</p>
                        </div>
                        <div className="despesa-right">
                          <p className="despesa-valor">
                            R{"$ "}
                            {Number(despesa.valor || 0).toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                              }
                            )}
                          </p>
                          <button
                            className="btn-remover-despesa"
                            onClick={() => handleRemoverDespesa(despesa.id)}
                            title="Remover despesa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="lista-vazia">
                    <p>Nenhuma despesa cadastrada</p>
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
                <h2>Nova Despesa</h2>
                <form
                  className="forma-despesa"
                  onSubmit={handleAdicionarDespesa}
                >
                  <div className="form-group">
                    <label htmlFor="nome">Nome</label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      placeholder="Ex: Mercado, Aluguel..."
                      value={novaDespesa.nome}
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
                      value={novaDespesa.valor}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="data">Data</label>
                    <input
                      type="date"
                      id="data"
                      name="data"
                      value={novaDespesa.data}
                      onChange={handleInputChange}
                    />
                  </div>
                  <button type="submit" className="btn-salvar">
                    Salvar Despesa
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

export default Despesas;