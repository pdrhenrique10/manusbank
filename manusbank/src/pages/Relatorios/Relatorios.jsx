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

const CORES_DESPESAS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];

const PERIODOS = [
  { label: "Este mês", value: "mes" },
  { label: "3 meses", value: "3m" },
  { label: "6 meses", value: "6m" },
  { label: "Ano", value: "ano" },
];

// Formata "2026-06" → "jun/26", para exibir no eixo do gráfico de evolução
function formatarMesKey(mesKey) {
  const [ano, mes] = mesKey.split("-");
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${nomes[Number(mes) - 1]}/${String(ano).slice(2)}`;
}

// Formata "YYYY-MM-DD" → "DD/MM/YYYY" para exibição legível
function formatarData(dataStr) {
  if (!dataStr) return "";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

function Relatorios() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [periodo, setPeriodo] = useState("mes");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

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
          totalReceitas: 0,
          totalDespesas: 0,
          despesasPorCategoria: [],
          evolucaoMensal: [],
          temDados: false,
          mensagem: "Erro ao carregar os dados.",
          dataInicio: null,
          dataFim: null,
        });
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [navigate, periodo]);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const saldo = Number(dados?.saldoAtual || 0);
  const receitas = Number(dados?.totalReceitas || 0);
  const despesas = Number(dados?.totalDespesas || 0);
  const resultado = receitas - despesas;
  const taxaEconomia = receitas > 0 ? (resultado / receitas) * 100 : 0;
  const categorias = dados?.despesasPorCategoria || [];
  const totalCategorias = categorias.reduce((soma, item) => soma + Number(item.valor || 0), 0);

  // temDados vem do backend — fonte da verdade única, sem recalculo no frontend
  const temDados = dados?.temDados ?? false;

  const comparativo = [
    { nome: "Entradas", valor: receitas },
    { nome: "Gastos", valor: despesas },
  ];

  const categoriasOrdenadas = useMemo(() => {
    return [...categorias]
      .map((item) => ({
        nome: item.nome || "Sem categoria",
        valor: Number(item.valor || 0),
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [categorias]);

  // Evolução mensal com nome formatado para o eixo X
  const evolucaoFormatada = useMemo(() => {
    return (dados?.evolucaoMensal || []).map((item) => ({
      ...item,
      nomeFormatado: formatarMesKey(item.nome),
    }));
  }, [dados]);

  const maiorCategoria = categoriasOrdenadas[0];

  const insights = [
    maiorCategoria
      ? `Sua maior categoria de gasto foi ${maiorCategoria.nome}, com ${formatMoney(maiorCategoria.valor)}.`
      : "Ainda não há categorias suficientes para identificar o maior peso nos gastos.",
    receitas > 0
      ? `Sua taxa de economia no período está em ${taxaEconomia.toFixed(0)}%.`
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
          <p className="rel-loading">Carregando relatórios...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "20px" }}>
        <div className="rel-container">
          <div className="rel-card">
            <header className="rel-header">
              <h1>
                <BarChart2 size={28} />
                Relatórios
              </h1>
              <p className="subtitle">Analise entradas, gastos, sobra e categorias por período.</p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}

            {/* ── FILTRO DE PERÍODO ── */}
            <section className="rel-filtros" aria-label="Filtro de período">
              <div className="rel-filtros-label">
                <CalendarDays size={18} />
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

              {/*
                Exibe a janela exata de datas que o backend usou para filtrar.
                Isso deixa claro para o usuário o que está sendo exibido,
                especialmente quando o período está incompleto (ex: dia 4 do mês).
              */}
              {dados?.dataInicio && dados?.dataFim && (
                <p className="rel-janela">
                  Exibindo de <strong>{formatarData(dados.dataInicio)}</strong> até{" "}
                  <strong>{formatarData(dados.dataFim)}</strong>
                </p>
              )}
            </section>

            {/* ── CARDS DE RESUMO ── */}
            <section className="rel-resumo">
              <div className="rel-resumo-card saldo">
                <p className="rel-resumo-label">Saldo atual</p>
                <p className="rel-resumo-valor">{formatMoney(saldo)}</p>
              </div>

              <div className="rel-resumo-card receita">
                <p className="rel-resumo-label">Entradas</p>
                <p className="rel-resumo-valor">{formatMoney(receitas)}</p>
              </div>

              <div className="rel-resumo-card despesa">
                <p className="rel-resumo-label">Gastos</p>
                <p className="rel-resumo-valor">{formatMoney(despesas)}</p>
              </div>

              <div className={`rel-resumo-card ${resultado >= 0 ? "positivo" : "negativo"}`}>
                <p className="rel-resumo-label">Sobra</p>
                <p className="rel-resumo-valor">{formatMoney(resultado)}</p>
              </div>
            </section>

            {/*
              Estado vazio: o backend já calculou se há dados no período.
              O frontend apenas consome `temDados` — não recalcula.
              A mensagem já vem personalizada com o período (ex: "este mês", "este ano").
            */}
            {!temDados ? (
              <section className="rel-empty">
                <CircleDollarSign size={28} />
                <h2>{dados?.mensagem}</h2>
                <p>Registre novas transações para ver seus relatórios aqui.</p>
              </section>
            ) : (
              <>
                {/* ── ENTRADAS x GASTOS + INSIGHTS ── */}
                <section className="rel-grid">
                  <div className="rel-grafico-section grande">
                    <div className="rel-section-header">
                      <div>
                        <h2>Entradas x Gastos</h2>
                        <p>Comparativo principal do período selecionado.</p>
                      </div>
                      {resultado >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>

                    <div className="rel-grafico-container">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={comparativo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
                          <XAxis dataKey="nome" stroke="#94a3b8" axisLine={false} tickLine={false} />
                          <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v) => formatMoney(v)} />
                          <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                            {comparativo.map((item) => (
                              <Cell
                                key={item.nome}
                                fill={item.nome === "Entradas" ? "#22c55e" : "#ef4444"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <aside className="rel-insights">
                    <div className="rel-section-header">
                      <div>
                        <h2>Leitura rápida</h2>
                        <p>O que os números estão indicando.</p>
                      </div>
                    </div>

                    {insights.map((insight) => (
                      <div className="rel-insight" key={insight}>
                        <span></span>
                        <p>{insight}</p>
                      </div>
                    ))}
                  </aside>
                </section>

                {/* ── EVOLUÇÃO MENSAL (só aparece quando há mais de 1 mês de dados) ── */}
                {evolucaoFormatada.length > 1 && (
                  <section className="rel-grafico-section">
                    <div className="rel-section-header">
                      <div>
                        <h2>Evolução mensal</h2>
                        <p>Entradas e gastos mês a mês no período.</p>
                      </div>
                    </div>

                    <div className="rel-grafico-container">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={evolucaoFormatada} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
                          <XAxis dataKey="nomeFormatado" stroke="#94a3b8" axisLine={false} tickLine={false} />
                          <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v) => formatMoney(v)} />
                          <Bar dataKey="receitas" name="Entradas" fill="#22c55e" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="despesas" name="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {/* ── GASTOS POR CATEGORIA ── */}
                <section className="rel-grafico-section">
                  <div className="rel-section-header">
                    <div>
                      <h2>
                        <PieIcon size={18} />
                        Gastos por categoria
                      </h2>
                      <p>Ranking das categorias que mais consumiram dinheiro.</p>
                    </div>
                  </div>

                  {categoriasOrdenadas.length > 0 ? (
                    <div className="rel-grafico-container">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={categoriasOrdenadas}
                          layout="vertical"
                          margin={{ top: 8, right: 20, left: 20, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
                          <XAxis type="number" stroke="#94a3b8" axisLine={false} tickLine={false} />
                          <YAxis
                            dataKey="nome"
                            type="category"
                            width={110}
                            stroke="#94a3b8"
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip formatter={(v) => formatMoney(v)} />
                          <Bar dataKey="valor" radius={[0, 8, 8, 0]}>
                            {categoriasOrdenadas.map((_, i) => (
                              <Cell key={i} fill={CORES_DESPESAS[i % CORES_DESPESAS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="rel-grafico-vazio">Nenhuma despesa registrada no período.</p>
                  )}
                </section>

                {/* ── TABELA DE CATEGORIAS ── */}
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
                              {totalCategorias > 0
                                ? `${((item.valor / totalCategorias) * 100).toFixed(0)}%`
                                : "0%"}
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