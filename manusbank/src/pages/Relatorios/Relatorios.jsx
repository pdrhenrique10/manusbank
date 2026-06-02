import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Relatorios.css";
import { BarChart2, PieChart as PieIcon } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const CORES_DESPESAS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];

function Relatorios() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const resp = await fetch("http://localhost:3000/api/relatorios", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (resp.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setErro("Sessão expirada. Faça login novamente.");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        if (!resp.ok) throw new Error(`Erro ${resp.status}`);
        const json = await resp.json();
        setDados(json);
      } catch (err) {
        console.error(err);
        setErro(err.message);
        setDados({
          saldoAtual: 0,
          totalReceitas: 0,
          totalDespesas: 0,
          receitasDespesasMes: { receitas: 0, despesas: 0 },
          despesasPorCategoria: [],
        });
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [navigate]);

  if (carregando) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "20px" }}>Carregando relatórios...</main>
      </div>
    );
  }

  const saldo = dados?.saldoAtual || 0;
  const receitas = dados?.totalReceitas || 0;
  const despesas = dados?.totalDespesas || 0;
  const grafico = [
    { nome: "Receitas", valor: dados?.receitasDespesasMes?.receitas || 0 },
    { nome: "Despesas", valor: dados?.receitasDespesasMes?.despesas || 0 },
  ];
  const categorias = dados?.despesasPorCategoria || [];
  const totalCat = categorias.reduce((s, i) => s + i.valor, 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "20px" }}>
        <div className="rel-container">
          <div className="rel-card">
            <header className="rel-header">
              <h1><BarChart2 size={32} /> Relatórios Financeiros</h1>
              <p className="subtitle">Resumo de receitas, despesas e saldo</p>
            </header>
            {erro && <p className="erro-msg">{erro}</p>}

            <section className="rel-resumo">
              <div className="rel-resumo-card saldo">
                <p>Saldo atual</p>
                <p className="rel-resumo-valor">R$ {saldo.toFixed(2)}</p>
              </div>
              <div className="rel-resumo-card receita">
                <p>Total receitas</p>
                <p className="rel-resumo-valor">R$ {receitas.toFixed(2)}</p>
              </div>
              <div className="rel-resumo-card despesa">
                <p>Total despesas</p>
                <p className="rel-resumo-valor">R$ {despesas.toFixed(2)}</p>
              </div>
            </section>

            <section className="rel-grafico-section">
              <h2>Receitas x Despesas</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={grafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nome" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={v => `R$ ${v.toFixed(2)}`} />
                  <Bar dataKey="valor" radius={[8,8,0,0]}>
                    {grafico.map((e, i) => <Cell key={i} fill={e.nome === "Receitas" ? "#22c55e" : "#ef4444"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="rel-grafico-section">
              <h2><PieIcon size={20} /> Despesas por categoria</h2>
              {categorias.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorias}
                      dataKey="valor"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ nome, valor }) => `${nome} (${((valor / totalCat) * 100).toFixed(0)}%)`}
                      labelLine
                    >
                      {categorias.map((_, i) => <Cell key={i} fill={CORES_DESPESAS[i % CORES_DESPESAS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={v => `R$ ${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="rel-grafico-vazio">Nenhuma despesa registrada.</p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Relatorios;