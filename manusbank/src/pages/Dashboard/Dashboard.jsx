import "./Dashboard.css";

import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock3,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const data = [];

const pieData = [
  { name: "Sem categoria", value: 340 },
  { name: "Salário", value: 100 },
];

const COLORS = ["#6C63FF", "#7C4DFF"];

export default function Dashboard() {
  return (
      <div className="dashboard">
        <div className="top">
          <h1>Dashboard</h1>
          <p>Mai 2026 — Resumo financeiro</p>
        </div>

        <div className="cards">
          <div className="card green">
            <div className="iconBox greenBg">
              <ArrowUpRight size={18} />
            </div>

            <h2>R$ 0,00</h2>
            <span>Faturamento do mês</span>
            <p>Receitas recebidas</p>
          </div>

          <div className="card red">
            <div className="iconBox redBg">
              <ArrowDownRight size={18} />
            </div>

            <h2>R$ 0,00</h2>
            <span>Gastos do mês</span>
            <p>Despesas registradas</p>
          </div>

          <div className="card blue">
            <div className="iconBox blueBg">
              <TrendingUp size={18} />
            </div>

            <h2>R$ 0,00</h2>
            <span>Lucro do mês</span>
            <p>Receitas - Despesas</p>
          </div>

          <div className="card yellow">
            <div className="iconBox yellowBg">
              <Clock3 size={18} />
            </div>

            <h2>R$ 0,00</h2>
            <span>Contas pendentes</span>
            <p>0 receita(s) pendente(s)</p>
          </div>
        </div>

        <div className="charts">
          <div className="chartCard big">
            <div className="chartHeader">
              <h3>Entradas e Saídas — 2026</h3>
              <p>Comparativo mensal de receitas e despesas</p>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data}>
                <XAxis dataKey="name" stroke="#6b7280" />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="receitas"
                  stroke="#00E5A8"
                  fill="#00E5A8"
                  fillOpacity={0.15}
                  strokeWidth={3}
                />

                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke="#FF4D4D"
                  fill="#FF4D4D"
                  fillOpacity={0.12}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="legend">
              <div>
                <span className="dot greenDot"></span>
                Receitas
              </div>

              <div>
                <span className="dot redDot"></span>
                Despesas
              </div>
            </div>
          </div>

          <div className="chartCard pieCard">
            <div className="chartHeader">
              <h3>Despesas por Categoria</h3>
              <p>Mai 2026</p>
            </div>

            <div className="pieWrapper">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={95}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="pieLegend">
              <div className="legendItem">
                <div className="left">
                  <span className="dot purple"></span>
                  Sem categoria
                </div>

                <strong>R$ 0,00</strong>
              </div>

              <div className="legendItem">
                <div className="left">
                  <span className="dot purple"></span>
                  Salário
                </div>

                <strong>R$ 0,00</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}