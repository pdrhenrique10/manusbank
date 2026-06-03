import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Sidebar from "../../components/Sidebar/Sidebar";

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

const COLORS = ["#6C63FF", "#7C4DFF", "#3B82F6", "#22C55E", "#F97316"];

const tooltipStyle = {
  contentStyle: {
    background: "#1f2937",
    border: "none",
    borderRadius: "8px",
    boxShadow: "none",
  },
  itemStyle: { color: "#f9fafb" },
  labelStyle: { color: "#9ca3af" },
};

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);
  const [saldo, setSaldo] = useState(0);
  const [transacoes, setTransacoes] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const resp = await fetch("http://localhost:3000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          if (resp.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
          }
          throw new Error("Erro ao carregar dashboard");
        }
        const dados = await resp.json();
        setUsuario(dados.usuario);
        setSaldo(dados.saldo || 0);
        setTransacoes(dados.transacoes || []);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    const fetchContasReceber = async () => {
      try {
        const resp = await fetch("http://localhost:3000/api/contas-receber", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const dados = await resp.json();
          setContasReceber(dados || []);
        }
      } catch (error) {
        console.error("Erro ao carregar contas a receber:", error);
      }
    };

    fetchDashboard();
    fetchContasReceber();
  }, [navigate]);

  const monthlyMap = transacoes.reduce((acc, t) => {
    if (!t.data) return acc;
    const date = new Date(t.data);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { name: monthKey, receitas: 0, despesas: 0 };
    }
    const isReceita = t.tipo === "deposito" || t.tipo === "transferenciaEntrada";
    const isDespesa = t.tipo === "saque" || t.tipo === "transferenciaSaida";
    if (isReceita) acc[monthKey].receitas += t.valor;
    else if (isDespesa) acc[monthKey].despesas += t.valor;
    return acc;
  }, {});
  const data = Object.values(monthlyMap);

  const despesasPorCategoriaMapa = transacoes
    .filter((t) => t.tipo === "saque" || t.tipo === "transferenciaSaida")
    .reduce((acc, t) => {
      const categoria = t.categoria || "Sem categoria";
      acc[categoria] = (acc[categoria] || 0) + t.valor;
      return acc;
    }, {});
  const pieData = Object.keys(despesasPorCategoriaMapa).map((categoria) => ({
    name: categoria,
    value: despesasPorCategoriaMapa[categoria],
  }));

  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();
  console.log("Mês atual:", mesAtual, "Ano:", anoAtual);
console.log("Todas transações:", transacoes);
  const transacoesMesAtual = transacoes.filter((t) => {
    if (!t.data) return false;
    const d = new Date(t.data);
    return d.getFullYear() === anoAtual && d.getMonth() === mesAtual;
  });
  console.log("Transações do mês:", transacoesMesAtual);
  const receitasMesAtual = transacoesMesAtual
    .filter((t) => t.tipo === "deposito" || t.tipo === "transferenciaEntrada")
    .reduce((acc, t) => acc + t.valor, 0);
  const despesasMesAtual = transacoesMesAtual
    .filter((t) => t.tipo === "saque" || t.tipo === "transferenciaSaida")
    .reduce((acc, t) => acc + t.valor, 0);
  const lucroMesAtual = receitasMesAtual - despesasMesAtual;
  const totalDespesasMesAtual = despesasMesAtual;

  const contasPendentes = contasReceber.filter((c) => c.status === "pendente");
  const totalContasPendentes = contasPendentes.length;

  if (loading) {
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
        <div className="dashboard">
          <div className="top">
            <div>
              <h1>Dashboard</h1>
              <p>{usuario?.nome || usuario?.email} — Resumo financeiro</p>
            </div>
          </div>

          <div className="cards">
            <div className="card green">
              <div className="iconBox greenBg"><ArrowUpRight size={18} /></div>
              <h2>R$ {saldo.toFixed(2)}</h2>
              <span>Saldo atual</span>
              <p>Valor disponível na sua conta</p>
            </div>
            <div className="card red">
              <div className="iconBox redBg"><ArrowDownRight size={18} /></div>
              <h2>R$ {totalDespesasMesAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h2>
              <span>Gastos do mês</span>
              <p>Despesas registradas</p>
            </div>
            <div className="card blue">
              <div className="iconBox blueBg"><TrendingUp size={18} /></div>
              <h2>R$ {lucroMesAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h2>
              <span>Lucro do mês</span>
              <p>Receitas - Despesas</p>
            </div>
            <div className="card yellow">
              <div className="iconBox yellowBg"><Clock3 size={18} /></div>
              <h2>{totalContasPendentes}</h2>
              <span>Contas pendentes</span>
              <p>{totalContasPendentes} conta(s) a receber</p>
            </div>
          </div>

          <div className="charts">
            {/* ===== ÁREA: ENTRADAS E SAÍDAS ===== */}
            <div className="chartCard big">
              <div className="chartHeader">
                <h3>Entradas e Saídas — {anoAtual}</h3>
                <p>Comparativo mensal de receitas e despesas</p>
              </div>
              {data.length <= 1 ? (
                <div style={{ padding: "16px", color: "#9ca3af", fontSize: "0.9rem" }}>
                  Ainda não há dados suficientes para montar o gráfico.
                  Registre transações em meses diferentes para ver o histórico.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#6b7280" axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="receitas"
                      stroke="#00E5A8"
                      fill="#00E5A8"
                      fillOpacity={0.15}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="despesas"
                      stroke="#FF4D4D"
                      fill="#FF4D4D"
                      fillOpacity={0.12}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              <div className="legend">
                <div><span className="dot greenDot"></span> Receitas</div>
                <div><span className="dot redDot"></span> Despesas</div>
              </div>
            </div>

            {/* ===== PIE: DESPESAS POR CATEGORIA ===== */}
            <div className="chartCard pieCard">
              <div className="chartHeader">
                <h3>Despesas por Categoria</h3>
                <p>{new Date().toLocaleString("pt-BR", { month: "short", year: "numeric" })}</p>
              </div>
              <div className="pieWrapper">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Tooltip
                      contentStyle={{
                        background: "#1f2937",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "none",
                      }}
                      itemStyle={{ color: "#f9fafb" }}
                      labelStyle={{ color: "#9ca3af" }}
                      formatter={(value) => [`R$ ${value.toFixed(2)}`, ""]}
                    />
                    <Pie
                      data={pieData}
                      innerRadius={70}
                      outerRadius={95}
                      dataKey="value"
                      stroke="none"
                      strokeWidth={0}
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="none"
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pieLegend">
                {pieData.map((item, index) => (
                  <div className="legendItem" key={item.name}>
                    <div className="left">
                      <span className="dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      {item.name}
                    </div>
                    <strong>R$ {item.value.toFixed(2)}</strong>
                  </div>
                ))}
                {pieData.length === 0 && (
                  <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Nenhuma despesa cadastrada ainda.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}