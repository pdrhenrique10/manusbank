import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import { API_URL } from "../../config/api";
import { dataHojeLocal, janelaMesAtual } from "../../utils/periodo";
import { useCurrency } from "../../context/CurrencyProvider";
import { useIdioma } from "../../context/IdiomaContext";

import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  ListChecks,
  Plus,
  Target,
  Wallet,
} from "lucide-react";

function formatarDataString(dataString) {
  if (!dataString) return "Sem data";
  const partes = dataString.split("-");
  if (partes.length !== 3) return dataString;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  // 🛑 formatFromBRL não existe no CurrencyProvider (nunca existiu).
  // formatMoney: formata um valor que JÁ está na moeda atual (usado nos
  // agregados que o backend devolve prontos: saldo, receitas/gastos do mês).
  // formatValorNaMoeda: formata um valor na moeda do PRÓPRIO item (usado
  // nas listas, onde cada transação/conta carrega sua moeda de origem).
  const { formatMoney, formatValorNaMoeda } = useCurrency();
  const { t } = useIdioma();

  const [usuario, setUsuario] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [saldo, setSaldo] = useState(0);
  const [receitasMesAtual, setReceitasMesAtual] = useState(0);
  const [gastosMesAtual, setGastosMesAtual] = useState(0);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const { dataInicio, dataFim } = janelaMesAtual();

    const fetchDashboard = async () => {
      try {
        const resp = await fetch(`${API_URL}/api/dashboard`, { headers });
        if (!resp.ok) {
          if (resp.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
          }
          throw new Error("Erro ao carregar dashboard");
        }
        const dados = await resp.json();
        setUsuario(dados.usuario);
        setTransacoes(dados.transacoes || []);
        // 👇 o backend já calcula o saldo certo (convertendo cada
        // transação da SUA moeda antes de somar, e devolvendo o total
        // na moeda atual do usuário). Usamos o valor pronto em vez de
        // recalcular aqui — recalcular no front, somando t.valor cru
        // de transações que podem estar em moedas diferentes, foi
        // exatamente o mesmo bug que existia no backend antes.
        setSaldo(Number(dados.saldo) || 0);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      }
    };

    const fetchResumoMes = async () => {
      try {
        const resp = await fetch(
          `${API_URL}/api/relatorios?dataInicio=${dataInicio}&dataFim=${dataFim}`,
          { headers }
        );
        if (resp.ok) {
          const dados = await resp.json();
          // 👇 também já vêm convertidos pra moeda atual pelo backend
          setReceitasMesAtual(
            Number(dados.totalEntradas || dados.totalReceitas || 0)
          );
          setGastosMesAtual(
            Number(dados.totalGastos || dados.totalDespesas || 0)
          );
        }
      } catch (error) {
        console.error("Erro ao carregar resumo do mês:", error);
      }
    };

    const fetchContasReceber = async () => {
      try {
        const resp = await fetch(`${API_URL}/api/contas-receber`, { headers });
        if (resp.ok) {
          const dados = await resp.json();
          setContasReceber(dados || []);
        }
      } catch (error) {
        console.error("Erro ao carregar contas a receber:", error);
      }
    };

    await Promise.all([fetchDashboard(), fetchResumoMes(), fetchContasReceber()]);
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, [navigate]);

  useEffect(() => {
    const handleFocus = () => {
      carregarDados();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const hoje = dataHojeLocal();

  const contasPendentes = contasReceber.filter(
    (conta) => conta.status === "pendente"
  );

  const ultimasMovimentacoes = transacoes
    .filter((t) => t.data && t.data <= hoje)
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
    .slice(0, 5);

  const temDados = transacoes.length > 0 || contasReceber.length > 0;

  const acoesRapidas = [
    {
      label: t("dashboard.quickActions.fixedIncomes"),
      path: "/receitas",
      icon: ArrowUpRight,
    },
    {
      label: t("dashboard.quickActions.incomes"),
      path: "/contas-a-receber",
      icon: Wallet,
    },
    {
      label: t("dashboard.quickActions.monthlyExpenses"),
      path: "/despesas",
      icon: ArrowDownRight,
    },
    {
      label: t("dashboard.quickActions.unexpectedExpenses"),
      path: "/contas-a-pagar",
      icon: CreditCard,
    },
    {
      label: t("dashboard.quickActions.goals"),
      path: "/metasfinanceiras",
      icon: Target,
    },
  ];

  const passosIniciais = [
    {
      title: t("dashboard.step1Title"),
      text: t("dashboard.step1Text"),
      path: "/receitas",
    },
    {
      title: t("dashboard.step2Title"),
      text: t("dashboard.step2Text"),
      path: "/despesas",
    },
    {
      title: t("dashboard.step3Title"),
      text: t("dashboard.step3Text"),
      path: "/metasfinanceiras",
    },
  ];

  if (loading) {
    return (
      <div className="mainLayout">
        <Sidebar />
        <main className="dashboard">
          <div className="loadingBox">{t("geral.loading")}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="mainLayout">
      <Sidebar />
      <main className="dashboard">
        <div className="top">
          <div>
            <h1>{t("dashboard.title")}</h1>
            <p>
              {t("dashboard.subtitle", {
                nome: usuario?.nome || usuario?.email || "Sua conta",
              })}
            </p>
          </div>
        </div>

        <section className="heroPanel">
          <div>
            <span className="eyebrow">{t("dashboard.situation")}</span>
            <h2>
              {temDados
                ? contasPendentes.length > 0
                  ? t("dashboard.heroPending", { count: contasPendentes.length })
                  : t("dashboard.heroNoPending")
                : t("dashboard.heroNoData")}
            </h2>
            <p>
              {temDados
                ? t("dashboard.heroHasData")
                : t("dashboard.heroNoDataSub")}
            </p>
          </div>

          <button
            className="heroButton"
            type="button"
            onClick={() => navigate("/receitas")}
          >
            <Plus size={18} />
            {t("dashboard.registerIncome")}
          </button>
        </section>

        <section className="cards">
          <div className="card green">
            <div className="iconBox greenBg">
              <Wallet size={18} />
            </div>
            {/* saldo já vem pronto (e correto) do backend, na moeda atual */}
            <h2>{formatMoney(saldo)}</h2>
            <span>{t("dashboard.balance")}</span>
            <p>{t("dashboard.balanceDesc")}</p>
          </div>

          <div className="card blue">
            <div className="iconBox blueBg">
              <ArrowUpRight size={18} />
            </div>
            <h2>{formatMoney(receitasMesAtual)}</h2>
            <span>{t("dashboard.monthIncome")}</span>
            <p>{t("dashboard.incomeDesc")}</p>
          </div>

          <div className="card red">
            <div className="iconBox redBg">
              <ArrowDownRight size={18} />
            </div>
            <h2>{formatMoney(gastosMesAtual)}</h2>
            <span>{t("dashboard.monthExpenses")}</span>
            <p>{t("dashboard.expensesDesc")}</p>
          </div>
        </section>

        <section className="quickActions">
          {acoesRapidas.map((acao) => {
            const Icon = acao.icon;
            return (
              <button
                key={acao.label}
                type="button"
                onClick={() => navigate(acao.path)}
              >
                <Icon size={17} />
                {acao.label}
              </button>
            );
          })}
        </section>

        <section className="dashboardGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h3>{t("dashboard.pending")}</h3>
                <p>{t("dashboard.pendingDesc")}</p>
              </div>
              <Clock3 size={18} />
            </div>

            {contasPendentes.length > 0 ? (
              <div className="taskList">
                {contasPendentes.slice(0, 4).map((conta) => (
                  <div
                    className="taskItem"
                    key={conta.id || conta._id || conta.cliente}
                  >
                    <div>
                      <strong>
                        {conta.cliente ||
                          conta.descricao ||
                          conta.nome ||
                          t("dashboard.pendingFallback")}
                      </strong>
                      <span>
                        {formatarDataString(conta.vencimento || conta.data)}
                      </span>
                    </div>
                    {/* cada conta exibida na SUA PRÓPRIA moeda, sem reconverter */}
                    <b>{formatValorNaMoeda(conta.valor, conta.moeda)}</b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="emptyState">
                <CheckCircle2 size={22} />
                <p>{t("dashboard.noPending")}</p>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h3>{t("dashboard.firstSteps")}</h3>
                <p>{t("dashboard.firstStepsDesc")}</p>
              </div>
              <ListChecks size={18} />
            </div>

            <div className="setupList">
              {passosIniciais.map((passo) => (
                <button
                  key={passo.title}
                  type="button"
                  onClick={() => navigate(passo.path)}
                >
                  <strong>{passo.title}</strong>
                  <span>{passo.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel wide">
            <div className="panelHeader">
              <div>
                <h3>{t("dashboard.lastMovements")}</h3>
                <p>{t("dashboard.lastMovementsDesc")}</p>
              </div>
            </div>

            {ultimasMovimentacoes.length > 0 ? (
              <div className="movementList">
                {ultimasMovimentacoes.map((tMov) => {
                  const entrada =
                    tMov.tipo === "deposito" ||
                    tMov.tipo === "transferenciaEntrada";
                  return (
                    <div
                      className="movementItem"
                      key={
                        tMov.id ||
                        tMov._id ||
                        `${tMov.data}-${tMov.valor}`
                      }
                    >
                      <div>
                        <strong>
                          {tMov.descricao ||
                            tMov.categoria ||
                            t("dashboard.movementFallback")}
                        </strong>
                        <span>{formatarDataString(tMov.data)}</span>
                      </div>
                      <b
                        className={
                          entrada ? "positiveValue" : "negativeValue"
                        }
                      >
                        {entrada ? "+" : "-"}{" "}
                        {/* cada movimentação exibida na SUA PRÓPRIA moeda */}
                        {formatValorNaMoeda(tMov.valor, tMov.moeda)}
                      </b>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="emptyState">
                <p>{t("dashboard.noMovements")}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}