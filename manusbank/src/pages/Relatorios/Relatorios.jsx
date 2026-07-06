import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Relatorios.css";
import HistoricoRelatoriosModal from "./HistoricoRelatoriosModal";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  FileDown,
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API_URL } from "../../config/api";
import { janelaMesAtual } from "../../utils/periodo";
import { useCurrency } from "../../context/CurrencyProvider";
import { useIdioma } from "../../context/IdiomaContext";

const CORES_DESPESAS = [
  "#38bdf8",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
];

function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

const CustomTooltip = ({ active, payload, label, formatMoney }) => {
  if (!active || !payload?.length || !formatMoney) return null;

  return (
    <div className="rel-custom-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey || entry.name}
          className="tooltip-value"
          style={{ color: "#808080" }}
        >
          {entry.name}: {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  );
};

function Relatorios() {
  const navigate = useNavigate();
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const { formatMoney } = useCurrency();
  const { t, idioma } = useIdioma();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const dataInicio = janelaMesAtual().dataInicio;
  const [ano, mes] = dataInicio.split("-");
  const date = new Date(Number(ano), Number(mes) - 1, 1);
  const nomeMesTraduzido = date.toLocaleDateString(idioma, {
    month: "long",
    year: "numeric",
  });

  // 👇 extraído pra fora do useEffect pra poder ser chamado de novo
  // (ex: quando a aba ganha foco de novo), sem duplicar a lógica.
  const carregarRelatorios = useCallback(
    async (signal) => {
      try {
        setCarregando(true);
        setErro("");

        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const { dataInicio, dataFim } = janelaMesAtual();

        const resp = await fetch(
          `${API_URL}/api/relatorios?dataInicio=${dataInicio}&dataFim=${dataFim}`,
          {
            signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (resp.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setErro(t("relatorios.sessionExpired"));
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        if (!resp.ok) throw new Error(`Erro ${resp.status}`);

        const json = await resp.json();
        setDados(json);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        setErro(t("relatorios.errorLoading"));
        setDados({
          saldoAtual: 0,
          totalEntradas: 0,
          totalGastos: 0,
          gastosPorCategoria: [],
          temDados: false,
          mensagem: t("relatorios.errorFallback"),
        });
      } finally {
        if (!signal?.aborted) setCarregando(false);
      }
    },
    [navigate, t]
  );

  useEffect(() => {
    const controller = new AbortController();
    carregarRelatorios(controller.signal);
    return () => controller.abort();
  }, [carregarRelatorios]);

  // 👇 rebusca sempre que a aba/janela ganha foco de novo — cobre o
  // caso de editar uma transação/conta em outra aba e voltar pra cá
  // sem dar F5. Mesmo padrão já usado no Dashboard.
  useEffect(() => {
    const handleFocus = () => {
      carregarRelatorios();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [carregarRelatorios]);

  const receitas = Number(dados?.totalEntradas || dados?.totalReceitas || 0);
  const despesas = Number(dados?.totalGastos || dados?.totalDespesas || 0);
  const saldo = Number(
    dados?.saldoAtual !== undefined ? dados.saldoAtual : receitas - despesas
  );
  const resultado = Number(
    dados?.sobra !== undefined ? dados.sobra : receitas - despesas
  );
  const taxaEconomia =
    dados?.taxaEconomia !== undefined
      ? Number(dados.taxaEconomia)
      : receitas > 0
      ? (resultado / receitas) * 100
      : 0;

  const categories =
    dados?.gastosPorCategoria || dados?.despesasPorCategoria || [];
  const temDados = dados?.temDados ?? (receitas > 0 || despesas > 0);

  const comparativo = [
    { name: t("relatorios.income"), valor: receitas, fill: "#22c55e" },
    { name: t("relatorios.expenses"), valor: despesas, fill: "#ef4444" },
  ];

  const categoriasOrdenadas = useMemo(() => {
    return [...categories]
      .filter((item) => item?.nome && Number(item.valor) > 0)
      .map((item) => ({
        nome: item.nome || t("relatorios.uncategorized"),
        valor: Number(item.valor || 0),
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [categories, t]);

  const totalCategorias = categoriasOrdenadas.reduce(
    (acc, item) => acc + item.valor,
    0
  );

  const categoriasComPercentual = categoriasOrdenadas.map((item) => ({
    ...item,
    percentual:
      totalCategorias > 0
        ? ((item.valor / totalCategorias) * 100).toFixed(1)
        : 0,
  }));

  const maiorCategoria = categoriasOrdenadas[0];

  const insights = useMemo(() => {
    return [
      maiorCategoria
        ? t("relatorios.insight1", {
            categoria: maiorCategoria.nome,
            valor: formatMoney(maiorCategoria.valor),
          })
        : t("relatorios.insightNoCategory"),
      receitas > 0
        ? t("relatorios.insight2", { taxa: formatPercent(taxaEconomia) })
        : t("relatorios.insightNoIncome"),
      resultado >= 0
        ? t("relatorios.insight3Positive")
        : t("relatorios.insight3Negative"),
    ];
  }, [maiorCategoria, receitas, taxaEconomia, resultado, t, formatMoney]);

  return (
    <main className="rel-main-content">
      <div className="rel-container">
        <header className="rel-header">
          <div>
            <h1>{t("relatorios.title")}</h1>
            <p className="subtitle">
              {t("relatorios.subtitle")} {nomeMesTraduzido}
            </p>
          </div>

          <button
            className="rel-btn-exportar"
            onClick={() => setModalHistoricoAberto(true)}
          >
            <FileDown size={15} />
            Baixar relatórios em PDF
          </button>
        </header>

        {erro && <p className="erro-msg">{erro}</p>}

        {carregando ? (
          <section className="rel-loading" aria-live="polite">
            {t("geral.loading")}
          </section>
        ) : (
          <>
            <section
              className="rel-resumo"
              aria-label={t("relatorios.monthlySummary")}
            >
              <div className="rel-resumo-card saldo">
                <div className="rel-resumo-label">
                  <Wallet size={14} />
                  {t("relatorios.balance")}
                </div>
                <p className="rel-resumo-valor">{formatMoney(saldo)}</p>
              </div>

              <div className="rel-resumo-card receita">
                <div className="rel-resumo-label">
                  <ArrowUpCircle size={14} />
                  {t("relatorios.income")}
                </div>
                <p className="rel-resumo-valor">{formatMoney(receitas)}</p>
              </div>

              <div className="rel-resumo-card despesa">
                <div className="rel-resumo-label">
                  <ArrowDownCircle size={14} />
                  {t("relatorios.expenses")}
                </div>
                <p className="rel-resumo-valor">{formatMoney(despesas)}</p>
              </div>

              <div
                className={`rel-resumo-card ${
                  resultado >= 0 ? "positivo" : "negativo"
                }`}
              >
                <div className="rel-resumo-label">
                  <PiggyBank size={14} />
                  {t("relatorios.result")}
                </div>
                <p className="rel-resumo-valor">{formatMoney(resultado)}</p>
              </div>
            </section>

            {!temDados ? (
              <section className="rel-empty">
                <h2>{dados?.mensagem || t("relatorios.noData")}</h2>
              </section>
            ) : (
              <div className="rel-dashboard-grid">
                <section className="rel-grafico-section">
                  <div className="rel-section-header">
                    <div>
                      <h2>
                        <TrendingUp size={18} />
                        {t("relatorios.flowTitle")}
                      </h2>
                      <p>{t("relatorios.flowSubtitle")}</p>
                    </div>
                    {resultado >= 0 ? (
                      <TrendingUp size={18} className="rel-positive-icon" />
                    ) : (
                      <TrendingDown
                        size={18}
                        className="rel-negative-icon"
                      />
                    )}
                  </div>

                  <div className="rel-grafico-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={comparativo}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="rel-chart-grid"
                        />
                        <XAxis
                          dataKey="name"
                          className="rel-chart-axis"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(value) => formatMoney(value)}
                          className="rel-chart-axis"
                          axisLine={false}
                          tickLine={false}
                          width={88}
                        />
                        <Tooltip
                          content={
                            <CustomTooltip formatMoney={formatMoney} />
                          }
                          cursor={false}
                        />
                        <Bar
                          dataKey="valor"
                          radius={[8, 8, 0, 0]}
                          barSize={52}
                        >
                          {comparativo.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="rel-insights">
                  <div className="rel-section-header">
                    <div>
                      <h2>{t("relatorios.insightsTitle")}</h2>
                      <p>{t("relatorios.insightsSubtitle")}</p>
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

                {categoriasComPercentual.length > 0 && (
                  <section className="rel-grafico-section rel-categoria-secao">
                    <div className="rel-section-header">
                      <div>
                        <h2>
                          <PieIcon size={18} />
                          {t("relatorios.categoriesTitle")}
                        </h2>
                        <p>{t("relatorios.categoriesSubtitle")}</p>
                      </div>
                    </div>

                    <div className="rel-grafico-container rel-categorias-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={categoriasComPercentual}
                          layout="vertical"
                          margin={{
                            top: 10,
                            right: 50,
                            left: 20,
                            bottom: 10,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            className="rel-chart-grid"
                          />
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="nome"
                            type="category"
                            width={120}
                            axisLine={false}
                            tickLine={false}
                            className="rel-chart-axis"
                          />
                          <Tooltip
                            formatter={(value) => formatMoney(value)}
                            cursor={false}
                          />
                          <Bar
                            dataKey="valor"
                            radius={[0, 10, 10, 0]}
                            barSize={26}
                          >
                            {categoriasComPercentual.map((item, index) => (
                              <Cell
                                key={item.nome}
                                fill={
                                  CORES_DESPESAS[
                                    index % CORES_DESPESAS.length
                                  ]
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="rel-categorias-legenda">
                      {categoriasComPercentual.map((item, index) => (
                        <div key={item.nome} className="rel-categoria-item">
                          <div className="rel-categoria-info">
                            <span
                              className="rel-categoria-cor"
                              style={{
                                background:
                                  CORES_DESPESAS[
                                    index % CORES_DESPESAS.length
                                  ],
                              }}
                            />
                            <span>{item.nome}</span>
                          </div>
                          <div className="rel-categoria-valores">
                            <strong>{formatMoney(item.valor)}</strong>
                            <span>{item.percentual}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <HistoricoRelatoriosModal
        aberto={modalHistoricoAberto}
        onFechar={() => setModalHistoricoAberto(false)}
      />
    </main>
  );
}

export default Relatorios;