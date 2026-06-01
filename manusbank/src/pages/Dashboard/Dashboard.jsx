import { useEffect, useState } from "react";
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

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);
  const [saldo, setSaldo] = useState(0);
  const [transacoes, setTransacoes] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        // busca dashboard (saldo + transações)
        const resp = await fetch("http://localhost:3000/api/dashboard");

        if (!resp.ok) {
          window.location.href = "/login";
          return;
        }

        const dados = await resp.json();
        setUsuario(dados.usuario);
        setSaldo(dados.saldo || 0);
        setTransacoes(dados.transacoes || []);
      } catch (e) {
        console.error("Erro ao carregar dashboard:", e);
      }
    }

    async function carregarContasReceber() {
      try {
        const resp = await fetch(
          "http://localhost:3000/api/contas-receber"
        );

        if (!resp.ok) {
          // se der erro aqui, só loga; o resto do dashboard funciona
          console.error("Erro ao buscar contas a receber");
          return;
        }

        const dados = await resp.json();
        setContasReceber(dados || []);
      } catch (e) {
        console.error("Erro ao carregar contas a receber:", e);
      }
    }

    carregarDashboard();
    carregarContasReceber();
  }, []);

  // ===== ENTRADAS X SAÍDAS (agrupado por mês) =====
  const monthlyMap = transacoes.reduce((acc, t) => {
    // se não tiver data, ignora nesse gráfico
    if (!t.data) return acc;

    const date = new Date(t.data);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`; // ex: 2026-05

    if (!acc[monthKey]) {
      acc[monthKey] = { name: monthKey, receitas: 0, despesas: 0 };
    }

    const isReceita =
      t.tipo === "deposito" || t.tipo === "transferenciaEntrada";
    const isDespesa =
      t.tipo === "saque" || t.tipo === "transferenciaSaida";

    if (isReceita) {
      acc[monthKey].receitas += t.valor;
    } else if (isDespesa) {
      acc[monthKey].despesas += t.valor;
    }

    return acc;
  }, {});

  const data = Object.values(monthlyMap);
  console.log("DATA DASHBOARD:", data);

  // ===== DESPESAS POR CATEGORIA =====
  const despesasPorCategoriaMapa = transacoes
    .filter(
      (t) => t.tipo === "saque" || t.tipo === "transferenciaSaida"
    )
    .reduce((acc, t) => {
      const categoria = t.categoria || "Sem categoria";
      acc[categoria] = (acc[categoria] || 0) + t.valor;
      return acc;
    }, {});

  const pieData = Object.keys(despesasPorCategoriaMapa).map((categoria) => ({
    name: categoria,
    value: despesasPorCategoriaMapa[categoria],
  }));

  // ===== MÉTRICAS DO MÊS ATUAL =====
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const transacoesMesAtual = transacoes.filter((t) => {
    if (!t.data) return false;
    const d = new Date(t.data);
    const mesmaAno = d.getFullYear() === anoAtual;
    const mesmoMes = d.getMonth() === mesAtual;
    return mesmaAno && mesmoMes;
  });

  const receitasMesAtual = transacoesMesAtual
    .filter(
      (t) =>
        t.tipo === "deposito" || t.tipo === "transferenciaEntrada"
    )
    .reduce((acc, t) => acc + t.valor, 0);

  const despesasMesAtual = transacoesMesAtual
    .filter(
      (t) => t.tipo === "saque" || t.tipo === "transferenciaSaida"
    )
    .reduce((acc, t) => acc + t.valor, 0);

  const lucroMesAtual = receitasMesAtual - despesasMesAtual;
  const totalDespesasMesAtual = despesasMesAtual;

  // ===== CONTAS A RECEBER PENDENTES =====
  const contasPendentes = contasReceber.filter(
    (c) => c.status === "pendente"
  );
  const totalContasPendentes = contasPendentes.length;

  if (!usuario) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "20px" }}>
          <p>Carregando...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "20px" }}>
        <div className="dashboard">
          <div className="top">
            <h1>Dashboard</h1>
            <p>Mai 2026 — Resumo financeiro</p>
          </div>

          <div className="cards">
            {/* Saldo atual */}
            <div className="card green">
              <div className="iconBox greenBg">
                <ArrowUpRight size={18} />
              </div>

              <h2>R$ {saldo.toFixed(2)}</h2>
              <span>Saldo atual</span>
              <p>Valor disponível na sua conta</p>
            </div>

            {/* Gastos do mês */}
            <div className="card red">
              <div className="iconBox redBg">
                <ArrowDownRight size={18} />
              </div>

              <h2>
                R{"$ "}
                {totalDespesasMesAtual.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </h2>
              <span>Gastos do mês</span>
              <p>Despesas registradas</p>
            </div>

            {/* Lucro do mês */}
            <div className="card blue">
              <div className="iconBox blueBg">
                <TrendingUp size={18} />
              </div>

              <h2>
                R{"$ "}
                {lucroMesAtual.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </h2>
              <span>Lucro do mês</span>
              <p>Receitas - Despesas</p>
            </div>

            {/* Contas pendentes (Contas a Receber) */}
            <div className="card yellow">
              <div className="iconBox yellowBg">
                <Clock3 size={18} />
              </div>

              <h2>{totalContasPendentes}</h2>
              <span>Contas pendentes</span>
              <p>{totalContasPendentes} conta(s) a receber</p>
            </div>
          </div>

          <div className="charts">
            {/* ENTRADAS X SAÍDAS */}
<div className="chartCard big">
  <div className="chartHeader">
    <h3>Entradas e Saídas — 2026</h3>
    <p>Comparativo mensal de receitas e despesas</p>
  </div>

  {data.length <= 1 ? (
    <div style={{ padding: "16px", color: "#9ca3af", fontSize: "0.9rem" }}>
      Ainda não há dados suficientes para montar o gráfico.
      Registre transações em meses diferentes para ver o histórico.
    </div>
  ) : (
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
  )}

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

            {/* DESPESAS POR CATEGORIA */}
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
                {pieData.map((item, index) => (
                  <div className="legendItem" key={item.name}>
                    <div className="left">
                      <span
                        className="dot"
                        style={{
                          backgroundColor:
                            COLORS[index % COLORS.length],
                        }}
                      ></span>
                      {item.name}
                    </div>
                    <strong>R$ {item.value.toFixed(2)}</strong>
                  </div>
                ))}

                {pieData.length === 0 && (
                  <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                    Nenhuma despesa cadastrada ainda.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}