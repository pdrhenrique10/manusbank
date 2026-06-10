import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Relatorios.css";
import {
  BarChart2,
  CalendarDays,
  CircleDollarSign,
  PieChart as PieIcon,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
  LineChart,
  TrendingUp as TrendIcon,
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
  Line,
  LineChart as ReLineChart,
  Legend,
} from "recharts";

const CORES_DESPESAS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec489a"];

const PERIODOS = [
  { label: "Este mês", value: "mes" },
  { label: "3 meses", value: "3m" },
  { label: "6 meses", value: "6m" },
  { label: "Ano", value: "ano" },
];

// Tooltip customizado para os gráficos
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '4px 0 0', color: entry.color }}>
            {entry.name}: {formatMoney(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarMesKey(mesKey) {
  const [ano, mes] = mesKey.split("-");
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${nomes[Number(mes) - 1]}/${String(ano).slice(2)}`;
}

function Relatorios() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [periodo, setPeriodo] = useState("mes");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tipoGrafico, setTipoGrafico] = useState("linha"); // 'linha' ou 'barra'

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const resp = await fetch(`http://localhost:3000/api/relatorios?periodo=${periodo}`, {
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
        setCarregando(false);
      }
    }

    carregar();
  }, [navigate, periodo]);

  const saldo = Number(dados?.saldoAtual || 0);
  const receitas = Number(dados?.totalEntradas || dados?.totalReceitas || 0);
  const despesas = Number(dados?.totalGastos || dados?.totalDespesas || 0);
  const resultado = Number(dados?.sobra !== undefined ? dados.sobra : receitas - despesas);
  const taxaEconomia = dados?.taxaEconomia !== undefined ? dados.taxaEconomia : (receitas > 0 ? (resultado / receitas) * 100 : 0);
  
  const categorias = dados?.gastosPorCategoria || dados?.despesasPorCategoria || [];
  const totalCategorias = categorias.reduce((soma, item) => soma + Number(item.valor || 0), 0);
  const temDados = dados?.temDados ?? false;

  // Dados para o gráfico de evolução mensal (linha/barra)
  const evolucaoMensal = dados?.comparativoMensal || [];
  
  const dadosEvolucao = evolucaoMensal.map(item => ({
    mes: item.mes || item.nomeFormatado || "N/A",
    Entradas: item.entradas || item.receitas || 0,
    Gastos: item.gastos || item.despesas || 0,
  }));

  const comparativo = [
    { name: "Entradas", valor: receitas, fill: "#10b981" },
    { name: "Gastos", valor: despesas, fill: "#ef4444" },
  ];

  const categoriasOrdenadas = useMemo(() => {
    return [...categorias]
      .filter(item => item && item.nome && item.valor)
      .map((item) => ({
        nome: item.nome || "Sem categoria",
        valor: Number(item.valor || 0),
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [categorias]);

  const maiorCategoria = categoriasOrdenadas[0];

  const insights = [
    maiorCategoria
      ? `Sua maior categoria de gasto foi ${maiorCategoria.nome}, com ${formatMoney(maiorCategoria.valor)}.`
      : "Ainda não há categorias suficientes para identificar o maior peso nos gastos.",
    receitas > 0
      ? `Sua taxa de economia no período está em ${Math.round(taxaEconomia)}%.`
      : "Cadastre receitas para calcular sua taxa de economia.",
    resultado >= 0
      ? "O período fechou positivo: suas entradas cobriram os gastos."
      : "O período fechou negativo: seus gastos ultrapassaram as entradas.",
  ];

  if (carregando) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "20px" }}>
          <div className="rel-container">
            <div className="rel-loading">Carregando relatórios...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>
        <div className="rel-container">
          <div className="rel-card">
            <header className="rel-header">
              <h1>
                <BarChart2 size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
                Relatórios Financeiros
              </h1>
              <p className="subtitle">Análise completa de entradas, gastos, evolução e categorias</p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}

            {/* FILTRO DE PERÍODO */}
            <section className="rel-filtros" aria-label="Filtro de período">
              <div className="rel-filtros-label">
                <CalendarDays size={16} />
                <span>Período</span>
              </div>

              <div className="rel-periodos">
                {PERIODOS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={periodo === item.value ? "ativo" : ""}
                    onClick={() => setPeriodo(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Botão para alternar tipo de gráfico */}
              {dadosEvolucao.length > 0 && (
                <div className="rel-tipo-grafico">
                  <button
                    type="button"
                    className={tipoGrafico === "linha" ? "ativo" : ""}
                    onClick={() => setTipoGrafico("linha")}
                    title="Gráfico de linhas"
                  >
                    <LineChart size={16} />
                    Linhas
                  </button>
                  <button
                    type="button"
                    className={tipoGrafico === "barra" ? "ativo" : ""}
                    onClick={() => setTipoGrafico("barra")}
                    title="Gráfico de barras"
                  >
                    <TrendIcon size={16} />
                    Barras
                  </button>
                </div>
              )}
            </section>

            {/* CARDS DE RESUMO */}
            <section className="rel-resumo">
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

            {!temDados && receitas === 0 && despesas === 0 ? (
              <section className="rel-empty">
                <CircleDollarSign size={48} />
                <h2>{dados?.mensagem || "Nenhuma transação encontrada"}</h2>
                <p>Registre novas transações para ver seus relatórios aqui.</p>
              </section>
            ) : (
              <>
              {/* GRÁFICO PRINCIPAL: Entradas x Gastos (Barras) */}
<section className="rel-grafico-section">
  <div className="rel-section-header">
    <div>
      <h2>
        <TrendingUp size={18} />
        Entradas x Gastos
      </h2>
      <p>Comparativo total do período selecionado</p>
    </div>
    {resultado >= 0 ? <TrendingUp size={18} color="#10b981" /> : <TrendingDown size={18} color="#ef4444" />}
  </div>
  <div className="rel-grafico-container" style={{ height: 300 }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={comparativo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        {/* Remova ou comente esta linha para remover o fundo cinza */}
        {/* <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" /> */}
        
        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#475569' }} />
        <YAxis 
          tickFormatter={(value) => formatMoney(value)} 
          stroke="#94a3b8" 
          tick={{ fill: '#94a3b8' }} 
          axisLine={{ stroke: '#475569' }}
        />
        <Tooltip 
          formatter={(value) => formatMoney(value)} 
          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#38bdf8', borderRadius: '8px' }}
          cursor={{ fill: 'rgba(56, 189, 248, 0.05)' }}
        />
        <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
          <Cell key="cell-entradas" fill="#10b981" />
          <Cell key="cell-gastos" fill="#ef4444" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</section>

                {/* GRÁFICO DE EVOLUÇÃO MENSAL (LINHA OU BARRA) */}
                {dadosEvolucao.length > 0 && (
                  <section className="rel-grafico-section">
                    <div className="rel-section-header">
                      <div>
                        <h2>
                          <LineChart size={18} />
                          Evolução Mensal
                        </h2>
                        <p>Entradas e gastos mês a mês</p>
                      </div>
                    </div>
                    <div className="rel-grafico-container" style={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        {tipoGrafico === "linha" ? (
                          <ReLineChart data={dadosEvolucao} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
                            <XAxis dataKey="mes" stroke="#94a3b8" />
                            <YAxis tickFormatter={(value) => formatMoney(value)} stroke="#94a3b8" />
                            <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#38bdf8' }} />
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            <Line 
                              type="monotone" 
                              dataKey="Entradas" 
                              stroke="#10b981" 
                              strokeWidth={3}
                              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="Gastos" 
                              stroke="#ef4444" 
                              strokeWidth={3}
                              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </ReLineChart>
                        ) : (
                          <BarChart data={dadosEvolucao} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
                            <XAxis dataKey="mes" stroke="#94a3b8" />
                            <YAxis tickFormatter={(value) => formatMoney(value)} stroke="#94a3b8" />
                            <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#38bdf8' }} />
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            <Bar dataKey="Entradas" fill="#10b981" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {/* INSIGHTS */}
                <section className="rel-insights">
                  <div className="rel-section-header">
                    <div>
                      <h2>Insights</h2>
                      <p>O que os números indicam</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 16 }}>
                    {insights.map((insight, idx) => (
                      <div className="rel-insight" key={idx}>
                        <span></span>
                        <p>{insight}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* GASTOS POR CATEGORIA */}
                {categoriasOrdenadas.length > 0 && (
                  <section className="rel-grafico-section">
                    <div className="rel-section-header">
                      <div>
                        <h2>
                          <PieIcon size={18} />
                          Gastos por categoria
                        </h2>
                        <p>Ranking das categorias que mais impactaram</p>
                      </div>
                    </div>
                    <div className="rel-grafico-container" style={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={categoriasOrdenadas}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
                          <XAxis type="number" tickFormatter={(value) => formatMoney(value)} stroke="#94a3b8" />
                          <YAxis dataKey="nome" type="category" width={100} stroke="#94a3b8" />
                          <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#38bdf8' }} />
                          <Bar dataKey="valor" radius={[0, 8, 8, 0]}>
                            {categoriasOrdenadas.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CORES_DESPESAS[index % CORES_DESPESAS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {/* TABELA DE CATEGORIAS */}
                {categoriasOrdenadas.length > 0 && (
                  <section className="rel-tabela-categorias">
                    <h3>Detalhamento por categoria</h3>
                    <table className="rel-tabela">
                      <thead>
                        <tr>
                          <th>Categoria</th>
                          <th>Valor</th>
                          <th>Participação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoriasOrdenadas.map((item, index) => (
                          <tr key={item.nome}>
                            <td>
                              <span
                                className="rel-cor-indicador"
                                style={{ backgroundColor: CORES_DESPESAS[index % CORES_DESPESAS.length] }}
                              ></span>
                              {item.nome}
                            </td>
                            <td>{formatMoney(item.valor)}</td>
                            <td>
                              {totalCategorias > 0 ? `${((item.valor / totalCategorias) * 100).toFixed(0)}%` : "0%"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Relatorios;