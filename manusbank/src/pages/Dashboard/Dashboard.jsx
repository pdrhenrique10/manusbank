import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import { API_URL } from "../../config/api";

// 🔥 Importe o hook da moeda
import { useCurrency } from "../../context/CurrencyProvider";

import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  ListChecks,
  PiggyBank,
  Plus,
  Target,
  Wallet,
} from "lucide-react";

// 🔧 Formata uma string YYYY-MM-DD para DD/MM/YYYY (sem fuso horário)
function formatarDataString(dataString) {
  if (!dataString) return "Sem data";
  const partes = dataString.split("-");
  if (partes.length !== 3) return dataString;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  
  // 🔥 Inicializa o hook da moeda
  const { formatMoney, getCurrencySymbol } = useCurrency();

  const [usuario, setUsuario] = useState(null);
  const [saldo, setSaldo] = useState(0);
  const [transacoes, setTransacoes] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // 1. Verifica se está logado
    if (!token) {
      navigate("/login");
      return;
    }

    // ==========================================
    // 🔥 CORREÇÃO PARA TESTE SEM BACKEND 🔥
    // Se for o nosso token mockado, usamos dados de exemplo e pulamos a API
    // ==========================================
    if (token === "mock-token") {
      setUsuario({ nome: "Usuário Teste", email: "teste@mock.com" });
      setSaldo(3250.00);
      setTransacoes([
        { id: 1, descricao: "Salário Fixo", tipo: "deposito", valor: 5000, data: "2026-06-01" },
        { id: 2, descricao: "Aluguel", tipo: "saque", valor: 1200, data: "2026-06-05" },
        { id: 3, descricao: "Mercado", tipo: "saque", valor: 550, data: "2026-06-10" }
      ]);
      setContasReceber([
        { id: 1, descricao: "Cliente A", valor: 1500, status: "pendente", data: "2026-06-20" }
      ]);
      setLoading(false);
      return; // Para a execução aqui
    }
    // ==========================================

    // 2. Lógica REAL do Backend (Executada apenas se o token não for mockado)
    const fetchDashboard = async () => {
      try {
        const resp = await fetch(`${API_URL}/api/dashboard`, {
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
        const resp = await fetch(`${API_URL}/api/contas-receber`, {
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

  // 🔥 Não precisa mais do formatMoney local, pois estamos usando o do Provider

  const agora = new Date();
  const mesAtual = agora.getMonth(); // 0-indexed (janeiro = 0)
  const anoAtual = agora.getFullYear();

  // Filtra transações do mês atual usando a string YYYY-MM-DD (sem fuso)
  const transacoesMesAtual = useMemo(() => {
    return transacoes.filter((t) => {
      if (!t.data) return false;
      const [anoStr, mesStr] = t.data.split("-");
      const ano = parseInt(anoStr, 10);
      const mes = parseInt(mesStr, 10) - 1; // converte para 0-indexed
      return ano === anoAtual && mes === mesAtual;
    });
  }, [transacoes, anoAtual, mesAtual]);

  const receitasMesAtual = transacoesMesAtual
    .filter((t) => t.tipo === "deposito" || t.tipo === "transferenciaEntrada")
    .reduce((acc, t) => acc + Number(t.valor || 0), 0);

  const gastosMesAtual = transacoesMesAtual
    .filter((t) => t.tipo === "saque" || t.tipo === "transferenciaSaida")
    .reduce((acc, t) => acc + Number(t.valor || 0), 0);

  const sobraMesAtual = receitasMesAtual - gastosMesAtual;

  const contasPendentes = contasReceber.filter((conta) => conta.status === "pendente");

  // Últimas movimentações: ordena pela string YYYY-MM-DD decrescente (lexicográfica funciona)
  const ultimasMovimentacoes = [...transacoes]
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
    .slice(0, 5);

  const temDados = transacoes.length > 0 || contasReceber.length > 0;

  const acoesRapidas = [
    { label: "Receitas fixas", path: "/receitas", icon: ArrowUpRight },
    { label: "Entradas", path: "/contas-a-receber", icon: Wallet },
    { label: "Gastos mensais", path: "/despesas", icon: ArrowDownRight },
    { label: "Gastos imprevistos", path: "/contas-a-pagar", icon: CreditCard },
    { label: "Suas Metas", path: "/metasfinanceiras", icon: Target },
  ];

  const passosIniciais = [
    {
      title: "Cadastre suas receitas principais",
      text: "Salário fixo e outras rendas fixas.",
      path: "/receitas",
    },
    {
      title: "Adicione uma conta importante",
      text: "Registre contas que você tem que pagar sempre.",
      path: "/despesas",
    },
    {
      title: "Crie sua primeira meta",
      text: "Defina um objetivo e acompanhe o progresso.",
      path: "/metasfinanceiras",
    },
  ];

  if (loading) {
    return (
      <div className="mainLayout">
        <Sidebar />
        <main className="dashboard">
          <div className="loadingBox">Carregando...</div>
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
            <h1>Início</h1>
            <p>
              {usuario?.nome || usuario?.email || "Sua conta"} - prioridades, pendências e
              próximos passos.
            </p>
          </div>
        </div>

        <section className="heroPanel">
          <div>
            <span className="eyebrow">Situação de hoje</span>
            <h2>
              {temDados
                ? contasPendentes.length > 0
                  ? `Você tem ${contasPendentes.length} recebimento(s) pendente(s).`
                  : "Nenhuma pendência crítica no momento."
                : "Comece registrando os dados principais da sua vida financeira."}
            </h2>
            <p>
              {temDados
                ? "Use esta tela para agir rápido. Relatórios ficam para análise detalhada."
                : "Sem dados, gráfico nenhum ajuda. Primeiro alimente o sistema com entradas, gastos, contas e metas."}
            </p>
          </div>

          <button className="heroButton" type="button" onClick={() => navigate("/receitas")}>
            <Plus size={18} />
            Registrar renda
          </button>
        </section>

        <section className="cards">
          <div className="card green">
            <div className="iconBox greenBg">
              <Wallet size={18} />
            </div>
            {/* 🔥 Substituído por formatMoney do Provider */}
            <h2>{formatMoney(saldo)}</h2>
            <span>Saldo atual</span>
            <p>Valor disponível agora.</p>
          </div>

          <div className="card blue">
            <div className="iconBox blueBg">
              <ArrowUpRight size={18} />
            </div>
            {/* 🔥 Substituído por formatMoney do Provider */}
            <h2>{formatMoney(receitasMesAtual)}</h2>
            <span>Entradas do mês</span>
            <p>Receitas e entradas registradas.</p>
          </div>

          <div className="card red">
            <div className="iconBox redBg">
              <ArrowDownRight size={18} />
            </div>
            {/* 🔥 Substituído por formatMoney do Provider */}
            <h2>{formatMoney(gastosMesAtual)}</h2>
            <span>Gastos do mês</span>
            <p>Saídas registradas neste mês.</p>
          </div>
        </section>

        <section className="quickActions">
          {acoesRapidas.map((acao) => {
            const Icon = acao.icon;
            return (
              <button key={acao.label} type="button" onClick={() => navigate(acao.path)}>
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
                <h3>Pendências</h3>
                <p>O que pede atenção antes de virar problema.</p>
              </div>
              <Clock3 size={18} />
            </div>

            {contasPendentes.length > 0 ? (
              <div className="taskList">
                {contasPendentes.slice(0, 4).map((conta) => (
                  <div className="taskItem" key={conta.id || conta._id || conta.descricao}>
                    <div>
                      <strong>{conta.descricao || conta.nome || "Recebimento pendente"}</strong>
                      <span>{formatarDataString(conta.data)}</span>
                    </div>
                    <b>{formatMoney(conta.valor)}</b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="emptyState">
                <CheckCircle2 size={22} />
                <p>Nenhum recebimento pendente registrado.</p>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h3>Primeiros passos</h3>
                <p>Atalhos para deixar o sistema útil mais rápido.</p>
              </div>
              <ListChecks size={18} />
            </div>

            <div className="setupList">
              {passosIniciais.map((passo) => (
                <button key={passo.title} type="button" onClick={() => navigate(passo.path)}>
                  <strong>{passo.title}</strong>
                  <span>{passo.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel wide">
            <div className="panelHeader">
              <div>
                <h3>Últimas movimentações</h3>
                <p>O que entrou ou saiu recentemente.</p>
              </div>
            </div>

            {ultimasMovimentacoes.length > 0 ? (
              <div className="movementList">
                {ultimasMovimentacoes.map((t) => {
                  const entrada = t.tipo === "deposito" || t.tipo === "transferenciaEntrada";
                  return (
                    <div className="movementItem" key={t.id || t._id || `${t.data}-${t.valor}`}>
                      <div>
                        <strong>{t.descricao || t.categoria || "Movimentação"}</strong>
                        <span>{formatarDataString(t.data)}</span>
                      </div>
                      {/* 🔥 Substituído por formatMoney do Provider */}
                      <b className={entrada ? "positiveValue" : "negativeValue"}>
                        {entrada ? "+" : "-"} {formatMoney(t.valor)}
                      </b>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="emptyState">
                <p>Nenhuma movimentação registrada ainda.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}