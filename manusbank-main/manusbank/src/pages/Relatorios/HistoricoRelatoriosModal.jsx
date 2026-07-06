import { useEffect, useState } from "react";
import { X, Download, FileClock, AlertCircle } from "lucide-react";
import { API_URL } from "../../config/api";
import { ultimoDiaDoMes } from "../../utils/periodo";
import { useCurrency } from "../../context/CurrencyProvider";
import { useIdioma } from "../../context/IdiomaContext";
import { exportarRelatorioPDF } from "../../utils/exportarRelatorioPDF";
import "./HistoricoRelatoriosModal.css";

function nomeMesFormatado(mesStr, idioma) {
  // mesStr no formato "2026-07"
  const [ano, mes] = mesStr.split("-");
  const date = new Date(Number(ano), Number(mes) - 1, 1);
  return date.toLocaleDateString(idioma, { month: "long", year: "numeric" });
}

function HistoricoRelatoriosModal({ aberto, onFechar }) {
  const { formatMoney } = useCurrency();
  const { t, idioma } = useIdioma();
  const [meses, setMeses] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [baixando, setBaixando] = useState(null);
  const [limitado, setLimitado] = useState(false);
  const [totalDisponivel, setTotalDisponivel] = useState(0);

  useEffect(() => {
    if (!aberto) return;

    const controller = new AbortController();

    async function carregarMeses() {
      try {
        setCarregando(true);
        setErro("");
        const token = localStorage.getItem("token");

        const resp = await fetch(
          `${API_URL}/api/relatorios/meses-disponiveis`,
          {
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!resp.ok) throw new Error(`Erro ${resp.status}`);

        const json = await resp.json();
        const mesesDoBackend = json.meses || [];

        // Garante que o mês atual sempre apareça no topo, mesmo sem
        // transações ainda.
        const hoje = new Date();
        const mesAtual = `${hoje.getFullYear()}-${String(
          hoje.getMonth() + 1
        ).padStart(2, "0")}`;

        const listaFinal = mesesDoBackend.includes(mesAtual)
          ? mesesDoBackend
          : [mesAtual, ...mesesDoBackend];

        setMeses(listaFinal);
        setLimitado(json.limitado || false);
        setTotalDisponivel(json.totalDisponivel || listaFinal.length);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        setErro("Não foi possível carregar o histórico de meses.");
      } finally {
        if (!controller.signal.aborted) setCarregando(false);
      }
    }

    carregarMeses();
    return () => controller.abort();
  }, [aberto]);

  async function baixarPdfDoMes(mesStr) {
    try {
      setBaixando(mesStr);
      const token = localStorage.getItem("token");
      const [ano, mes] = mesStr.split("-").map(Number);
      const dataInicio = `${mesStr}-01`;
      const dataFim = `${mesStr}-${String(
        ultimoDiaDoMes(ano, mes)
      ).padStart(2, "0")}`;

      const resp = await fetch(
        `${API_URL}/api/relatorios?dataInicio=${dataInicio}&dataFim=${dataFim}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!resp.ok) throw new Error(`Erro ${resp.status}`);

      const dados = await resp.json();

      const receitas = Number(dados.totalEntradas || 0);
      const despesas = Number(dados.totalGastos || 0);
      const saldo = Number(dados.saldoAtual || 0);
      const resultado = Number(
        dados.sobra !== undefined ? dados.sobra : receitas - despesas
      );

      const categorias = dados.gastosPorCategoria || [];
      const totalCategorias = categorias.reduce(
        (acc, c) => acc + Number(c.valor || 0),
        0
      );
      const categoriasComPercentual = categorias
        .filter((c) => c?.nome && Number(c.valor) > 0)
        .map((c) => ({
          nome: c.nome,
          valor: Number(c.valor || 0),
          percentual:
            totalCategorias > 0
              ? ((Number(c.valor) / totalCategorias) * 100).toFixed(1)
              : 0,
        }))
        .sort((a, b) => b.valor - a.valor);

      const maiorCategoria = categoriasComPercentual[0];
      const taxaEconomia =
        receitas > 0 ? Math.round((resultado / receitas) * 100) : 0;

      const insights = [
        maiorCategoria
          ? t("relatorios.insight1", {
              categoria: maiorCategoria.nome,
              valor: formatMoney(maiorCategoria.valor),
            })
          : t("relatorios.insightNoCategory"),
        receitas > 0
          ? t("relatorios.insight2", { taxa: `${taxaEconomia}%` })
          : t("relatorios.insightNoIncome"),
        resultado >= 0
          ? t("relatorios.insight3Positive")
          : t("relatorios.insight3Negative"),
      ];

      exportarRelatorioPDF({
        saldo,
        receitas,
        despesas,
        resultado,
        categoriasComPercentual,
        insights,
        nomeMesTraduzido: nomeMesFormatado(mesStr, idioma),
        formatMoney,
        t,
      });
    } catch (err) {
      console.error(err);
      setErro("Não foi possível gerar o PDF desse mês. Tente novamente.");
    } finally {
      setBaixando(null);
    }
  }

  if (!aberto) return null;

  return (
    <div className="hrm-overlay" onClick={onFechar}>
      <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hrm-header">
          <div className="hrm-header-titulo">
            <FileClock size={20} />
            <h2>Relatórios de meses passados</h2>
          </div>
          <button
            className="hrm-fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="hrm-aviso">
          <AlertCircle size={16} />
          <p>
            Baixe o PDF para ver todos os detalhes de cada mês — o modal só
            lista os períodos disponíveis.
          </p>
        </div>

        <div className="hrm-lista">
          {carregando ? (
            <p className="hrm-estado">Carregando meses...</p>
          ) : erro ? (
            <p className="hrm-estado hrm-erro">{erro}</p>
          ) : meses.length === 0 ? (
            <p className="hrm-estado">
              Nenhum mês com transações registradas ainda.
            </p>
          ) : (
            meses.map((mesStr, index) => (
              <div key={mesStr} className="hrm-item">
                <span className="hrm-item-mes">
                  {nomeMesFormatado(mesStr, idioma)}
                  {index === 0 && (
                    <span className="hrm-badge-atual">mês atual</span>
                  )}
                </span>
                <button
                  className="hrm-item-btn"
                  onClick={() => baixarPdfDoMes(mesStr)}
                  disabled={baixando === mesStr}
                >
                  <Download size={14} />
                  {baixando === mesStr ? "Gerando..." : "Baixar PDF"}
                </button>
              </div>
            ))
          )}
        </div>

        {limitado && (
          <div className="hrm-upgrade">
            <p>
              Você está vendo só os últimos {meses.length} meses. Faça
              upgrade para o <strong>Premium</strong> e acesse todo o
              histórico ({totalDisponivel} meses disponíveis).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoricoRelatoriosModal;