import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Relatorios.css";
import { BarChart2, PieChart as PieIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CORES_DESPESAS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];

function Relatorios() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarRelatorios() {
      try {
        setCarregando(true);
        setErro("");

        const resp = await fetch("http://localhost:3000/api/relatorios");

        if (!resp.ok) {
          throw new Error("Erro ao buscar relatórios");
        }

        const json = await resp.json();
        setDados(json);
      } catch (e) {
        console.error("Erro ao carregar relatórios:", e);
        setErro("Não foi possível carregar os relatórios.");
      } finally {
        setCarregando(false);
      }
    }

    carregarRelatorios();
  }, []);

  const saldoAtual = dados?.saldoAtual || 0;
  const totalReceitas = dados?.totalReceitas || 0;
  const totalDespesas = dados?.totalDespesas || 0;

  const graficoReceitasDespesasMes = [
    {
      nome: "Receitas",
      valor: dados?.receitasDespesasMes?.receitas || 0,
    },
    {
      nome: "Despesas",
      valor: dados?.receitasDespesasMes?.despesas || 0,
    },
  ];

  const despesasPorCategoria = dados?.despesasPorCategoria || [];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "20px" }}>
        <div className="rel-container">
          <div className="rel-card">
            <header className="rel-header">
              <h1>
                <BarChart2 size={32} />
                Relatórios Financeiros
              </h1>
              <p className="subtitle">
                Veja um resumo das suas receitas, despesas e saldo
              </p>
            </header>

            {erro && (
              <p style={{ color: "#f97316", marginBottom: "10px" }}>
                {erro}
              </p>
            )}

            {/* Cards de resumo */}
            <section className="rel-resumo">
              <div className="rel-resumo-card saldo">
                <p className="rel-resumo-label">Saldo atual</p>
                <p className="rel-resumo-valor">
                  R{"$ "}
                  {saldoAtual.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="rel-resumo-card receita">
                <p className="rel-resumo-label">Total de receitas</p>
                <p className="rel-resumo-valor">
                  R{"$ "}
                  {totalReceitas.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="rel-resumo-card despesa">
                <p className="rel-resumo-label">Total de despesas</p>
                <p className="rel-resumo-valor">
                  R{"$ "}
                  {totalDespesas.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </section>

            {/* Gráfico Receitas x Despesas do mês */}
            <section className="rel-grafico-section">
              <h2>Receitas x Despesas do mês</h2>
              <div className="rel-grafico-container">
                {carregando ? (
                  <p className="rel-grafico-vazio">
                    Carregando dados...
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={graficoReceitasDespesasMes}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />
                      <XAxis dataKey="nome" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          background: "#020617",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#e5e7eb" }}
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
                        radius={[8, 8, 0, 0]}
                      >
                        {graficoReceitasDespesasMes.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.nome === "Receitas"
                                ? "#22c55e"
                                : "#ef4444"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Gráfico Despesas por Categoria */}
            <section className="rel-grafico-section">
              <h2>
                <PieIcon size={20} style={{ marginRight: 8 }} />
                Despesas por categoria
              </h2>
              <div className="rel-grafico-container">
                {carregando ? (
                  <p className="rel-grafico-vazio">
                    Carregando dados...
                  </p>
                ) : despesasPorCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={despesasPorCategoria}
                        dataKey="valor"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) =>
                          `${entry.nome} (${(
                            (entry.valor /
                              despesasPorCategoria.reduce(
                                (acc, d) => acc + d.valor,
                                0
                              )) *
                            100
                          ).toFixed(0)}%)`
                        }
                      >
                        {despesasPorCategoria.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              CORES_DESPESAS[
                                index % CORES_DESPESAS.length
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip
                        contentStyle={{
                          background: "#020617",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#e5e7eb" }}
                        formatter={(value, name) => [
                          "R$ " +
                            Number(value).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            }),
                          "Despesa",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="rel-grafico-vazio">
                    Ainda não há despesas registradas neste mês.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Relatorios;