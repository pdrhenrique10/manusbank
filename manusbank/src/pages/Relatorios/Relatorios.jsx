import React, { useState } from "react";
import "./Relatorios.css";
import { BarChart3, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function Relatorios() {
  // Valores iniciais zerados
  const [resumo] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
  });

  // Dados de exemplo simples (você depois pode conectar com o backend/estado global)
  const dadosMensais = [
    { mes: "Jan", receitas: 0, despesas: 0 },
    { mes: "Fev", receitas: 0, despesas: 0 },
    { mes: "Mar", receitas: 0, despesas: 0 },
  ];

  const dadosCategorias = [
    { categoria: "Moradia", valor: 0 },
    { categoria: "Alimentação", valor: 0 },
    { categoria: "Transporte", valor: 0 },
  ];

  return (
    <main className="rl-container">
      <div className="rl-card">
        <header className="rl-header">
          <h1>
            <BarChart3 size={32} />
            Relatórios
          </h1>
          <p className="subtitle">Visão geral das suas finanças</p>
        </header>

        <section className="rl-resumo">
          <div className="rl-resumo-item receitas">
            <ArrowUpCircle size={26} />
            <div>
              <p className="rl-resumo-label">Total de Receitas</p>
              <p className="rl-resumo-valor">
                R$ {resumo.totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="rl-resumo-item despesas">
            <ArrowDownCircle size={26} />
            <div>
              <p className="rl-resumo-label">Total de Despesas</p>
              <p className="rl-resumo-valor">
                R$ {resumo.totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="rl-resumo-item saldo">
            <Wallet size={26} />
            <div>
              <p className="rl-resumo-label">Saldo</p>
              <p className="rl-resumo-valor">
                R$ {resumo.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </section>

        <section className="rl-graficos-grid">
          <div className="rl-grafico-box">
            <h2>Receitas x Despesas por Mês</h2>
            <div className="rl-grafico-container">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dadosMensais}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f8fafc" }}
                    formatter={(value) => ["R$ " + value.toLocaleString("pt-BR"), "Valor"]}
                  />
                  <Legend />
                  <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rl-grafico-box">
            <h2>Despesas por Categoria</h2>
            <div className="rl-grafico-container">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dadosCategorias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="categoria" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f8fafc" }}
                    formatter={(value) => ["R$ " + value.toLocaleString("pt-BR"), "Valor"]}
                  />
                  <Bar dataKey="valor" name="Valor" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Relatorios;