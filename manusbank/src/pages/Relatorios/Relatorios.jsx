import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Relatorios.css";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  CircleDollarSign,
  LineChart,
  PieChart as PieIcon,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const CORES_DESPESAS = ["#38bdf8", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"];

const PERIODOS = [
  { label: "Este mês", value: "mes" },
  { label: "3 meses", value: "3m" },
  { label: "6 meses", value: "6m" },
  { label: "Ano", value: "ano" },
];

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rel-custom-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name} className="tooltip-value" style={{ color: entry.fill || entry.color }}>
          {entry.name}: {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  );
};

function Relatorios() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [periodo, setPeriodo] = useState("mes");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tipoGrafico, setTipoGrafico] = useState("linha");

  useEffect(() => {
    const controller = new AbortController();

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const resp = await fetch(`${API_URL}/api/relatorios?periodo=${periodo}`, {
          signal: controller.signal,
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
        if (err.name === "AbortError") return;
        console.error(err);
        setErro("Não foi possível carregar os relatórios agora.");
        setDados({
          saldoAtual: 0,
          totalEntradas: 0,
          totalGastos: 0,
          gastosPorCategoria: [],
          comparativoMensal: [],
          temDados: false,
          mensagem: "Erro ao carregar os dados.",
        });
      } finally {
        if (!controller.signal.aborted) setCarregando(false);
      }
    }

    carregar();
    return () => controller.abort();
  }, [navigate, periodo]);

  const receitas = Number(dados?.totalEntradas || dados?.totalReceitas || 0);
  const despesas = Number(dados?.totalGastos || dados?.totalDespesas || 0);
  const saldo = Number(dados?.saldoAtual !== undefined ? dados.saldoAtual : receitas - despesas);
  const resultado = Number(dados?.sobra !== undefined ? dados.sobra : receitas - despesas);
  const taxaEconomia = dados?.taxaEconomia !== undefined ? Number(dados.taxaEconomia) : receitas > 0 ? (resultado / receitas) * 100 : 0;

  const categories = dados?.gastosPorCategoria || dados?.despesasPorCategoria || [];
  const temDados = dados?.temDados ?? receitas > 0 || despesas > 0;

  const dadosEvolucao = useMemo(() => {
    const evolucaoMensal = dados?.comparativoMensal || [];

    return evolucaoMensal.map((item) => ({
      mes: item.mes || item.nomeFormatado || "N/A",
      Entradas: Number(item.Entradas ?? item.entradas ?? item.receitas ?? item.totalEntradas ?? 0),
      Gastos: Number(item.Gastos ?? item.gastos ?? item.despesas ?? item.totalGastos ?? 0),
    }));
  }, [dados]);

  const comparativo = [
    { name: "Entradas", valor: receitas, fill: "#22c55e" },
    { name: "Gastos", valor: despesas, fill: "#ef4444" },
  ];

  const categoriasOrdenadas = useMemo(() => {
    return [...categories]
      .filter((item) => item?.nome && Number(item.valor) > 0)
      .map((item) => ({
        nome: item.nome || "Sem categoria",
        valor: Number(item.valor || 0),
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [categories]);

  const maiorCategoria = categoriasOrdenadas[0];

  const insights = useMemo(() => {
    return [
      maiorCategoria
        ? `Sua maior categoria de gasto foi ${maiorCategoria.nome}, com ${formatMoney(maiorCategoria.valor)}.`
        : "Ainda não há categorias suficientes para identificar o maior peso nos gastos.",
      receitas > 0
        ? `Sua taxa de economia no período está em ${formatPercent(taxaEconomia)}.`
        : "Cadastre receitas para calcular sua taxa de economia.",
      resultado >= 0
        ? "O período fechou positivo: suas entradas cobriram os gastos."
        : "O período fechou negativo: seus gastos ultrapassaram as entradas.",
    ];
  }, [maiorCategoria, receitas, taxaEconomia, resultado]);

  return (
    <div className="rel-wrapper">
      <Sidebar />
      <main className="rel-main-content">
        <div className="rel-container">
          <header className="rel-header">
            <div>
              <h1>
                <LineChart size={30} />
                Relatórios Financeiros
              </h1>
              <p className="subtitle">Análise de entradas, gastos, evolução e categorias</p>
            </div>
          </header>

          {erro && <p className="erro-msg">{erro}</p>}

          <section className="rel-filtros" aria-label="Filtro de período">
            <div className="rel-filtros-label">
              <CalendarDays size={16} />
              <span>Período</span>
            </div>
            <div className="rel-periodos" role="group" aria-label="Selecionar período">
              {PERIODOS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={periodo === item.value ? "ativo" : ""}
                  onClick={() => setPeriodo(item.value)}
                  aria-pressed={periodo === item.value}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          {carregando ? (
            <section className="rel-loading" aria-live="polite">
              Carregando relatórios...
            </section>
          ) : (
            <>
              <section className="rel-resumo" aria-label="Resumo financeiro">
                <div className="rel-resumo-card saldo">
                  <div className="rel-resumo-label">
                    <Wallet size={14} />
                    Saldo atual
                  </div>
                  <p className="rel-resumo-valor">{formatMoney(saldo)}</p>
                </div>

                <div className="rel-resumo-card receita">
                  <div className="rel-resumo-label">
                    <ArrowUpCircle size={14} />
                    Entradas
                  </div>
                  <p className="rel-resumo-valor">{formatMoney(receitas)}</p>
                </div>

                <div className="rel-resumo-card despesa">
                  <div className="rel-resumo-label">
                    <ArrowDownCircle size={14} />
                    Gastos
                  </div>
                  <p className="rel-resumo-valor">{formatMoney(despesas)}</p>
                </div>

                <div className={`rel-resumo-card ${resultado >= 0 ? "positivo" : "negativo"}`}>
                  <div className="rel-resumo-label">
                    <PiggyBank size={14} />
                    Sobra
                  </div>
                  <p className="rel-resumo-valor">{formatMoney(resultado)}</p>
                </div>
              </section>

              {!temDados ? (
                <section className="rel-empty">
                  <CircleDollarSign size={44} />
                  <h2>{dados?.mensagem || "Nenhuma transação encontrada"}</h2>
                  <p>Registre novas transações para ver seus relatórios aqui.</p>
                </section>
              ) : (
                <div className="rel-dashboard-grid">
                  <section className="rel-grafico-section">
                    <div className="rel-section-header">
                      <div>
                        <h2>
                          <TrendingUp size={18} />
                          Fluxo geral
                        </h2>
                        <p>Comparativo total do período selecionado</p>
                      </div>
                      {resultado >= 0 ? <TrendingUp size={18} className="rel-positive-icon" /> : <TrendingDown size={18} className="rel-negative-icon" />}
                    </div>
                    <div className="rel-grafico-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparativo} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="rel-chart-grid" />
                          <XAxis dataKey="name" className="rel-chart-axis" axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={(value) => formatMoney(value)} className="rel-chart-axis" axisLine={false} tickLine={false} width={88} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.08)" }} />
                          <Bar dataKey="valor" radius={[8, 8, 0, 0]} barSize={52}>
                            {comparativo.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {dadosEvolucao.length > 0 && (
                    <section className="rel-grafico-section">
                      <div className="rel-section-header">
                        <div>
                          <h2>Histórico temporal</h2>
                          <p>Evolução de ganhos e gastos no tempo</p>
                        </div>
                        <div className="rel-toggle-botoes" role="group" aria-label="Tipo de gráfico">
                          <button type="button" className={tipoGrafico === "linha" ? "ativo" : ""} onClick={() => setTipoGrafico("linha")}>
                            Linha
                          </button>
                          <button type="button" className={tipoGrafico === "barra" ? "ativo" : ""} onClick={() => setTipoGrafico("barra")}>
                            Barras
                          </button>
                        </div>
                      </div>
                      <div className="rel-grafico-container">
                        <ResponsiveContainer width="100%" height="100%">
                          {tipoGrafico === "linha" ? (
                            <ReLineChart data={dadosEvolucao} margin={{ top: 20, right: 24, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} className="rel-chart-grid" />
                              <XAxis dataKey="mes" className="rel-chart-axis" axisLine={false} tickLine={false} />
                              <YAxis tickFormatter={(value) => formatMoney(value)} className="rel-chart-axis" axisLine={false} tickLine={false} width={88} />
                              <Tooltip content={<CustomTooltip />} />
                              <Line type="monotone" dataKey="Entradas" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                              <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            </ReLineChart>
                          ) : (
                            <BarChart data={dadosEvolucao} margin={{ top: 20, right: 24, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} className="rel-chart-grid" />
                              <XAxis dataKey="mes" className="rel-chart-axis" axisLine={false} tickLine={false} />
                              <YAxis tickFormatter={(value) => formatMoney(value)} className="rel-chart-axis" axisLine={false} tickLine={false} width={88} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </section>
                  )}

                  <section className="rel-insights">
                    <div className="rel-section-header">
                      <div>
                        <h2>Insights automatizados</h2>
                        <p>O que os dados sugerem sobre sua saúde financeira</p>
                      </div>
                    </div>
                    <div className="rel-insights-lista">
                      {insights.map((insight) => (
                        <div className="rel-insight-item" key={insight}>
                          <span className="dot-indicador" />
                          <p>{insight}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {categoriasOrdenadas.length > 0 && (
                    <section className="rel-grafico-section rel-categoria-secao">
                      <div className="rel-section-header">
                        <div>
                          <h2>
                            <PieIcon size={18} />
                            Divisão por categorias
                          </h2>
                          <p>Ranking dos maiores pesos orçamentários</p>
                        </div>
                      </div>
                      <div className="rel-grafico-container rel-categorias-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoriasOrdenadas} layout="vertical" margin={{ top: 10, right: 10, left: 12, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="rel-chart-grid" />
                            <XAxis type="number" tickFormatter={(value) => formatMoney(value)} className="rel-chart-axis" axisLine={false} tickLine={false} />
                            <YAxis dataKey="nome" type="category" className="rel-chart-axis" axisLine={false} tickLine={false} width={96} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={18}>
                              {categoriasOrdenadas.map((item, index) => (
                                <Cell key={item.nome} fill={CORES_DESPESAS[index % CORES_DESPESAS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Relatorios;
