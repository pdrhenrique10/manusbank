import "./TrocarPlano.css";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, ArrowLeft, Crown } from "lucide-react";
import { API_URL } from "../../config/api";

const MOEDAS = [
  { codigo: "BRL", label: "Real (R$)" },
  { codigo: "USD", label: "Dólar (U$)" },
  { codigo: "EUR", label: "Euro (€)" },
  { codigo: "GBP", label: "Libra (£)" },
];

export default function TrocarPlano() {
  const navigate = useNavigate();
  const location = useLocation();

  // moeda que o usuário tentou selecionar em Configurações antes de
  // cair aqui (se veio desse fluxo) — já vem pré-selecionada.
  const [moedaSelecionada, setMoedaSelecionada] = useState(
    location.state?.moedaPendente || "BRL"
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("token");

  const confirmarAssinatura = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const respPlano = await fetch(`${API_URL}/api/usuario/plano`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plano: "premium" }),
      });

      const dadosPlano = await respPlano.json();

      if (!respPlano.ok || !dadosPlano.sucesso) {
        setErro(dadosPlano.erro || "Não foi possível assinar o Premium.");
        setSalvando(false);
        return;
      }

      // aplica a moeda escolhida assim que o plano já é premium
      const respMoeda = await fetch(`${API_URL}/api/usuario/moeda`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ moeda: moedaSelecionada }),
      });

      const dadosMoeda = await respMoeda.json();

      // mantém localStorage("user") coerente
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsed,
              plano: "premium",
              moedaAtual: dadosMoeda.moedaAtual || moedaSelecionada,
            })
          );
        } catch (e) {
          // ignora — não é crítico
        }
      }

      navigate("/configuracoes", { state: { upgradeConcluido: true } });
    } catch (e) {
      console.error("Erro ao assinar premium:", e);
      setErro("Não foi possível assinar o Premium. Tente novamente.");
      setSalvando(false);
    }
  };

  // Cancelar: só navega de volta, nada foi persistido até aqui.
  const cancelarTroca = () => {
    navigate("/configuracoes");
  };

  return (
    <div className="trocar-plano-page">
      <div className="trocar-plano-header">
        <h1>
          Assine o Premium<span className="trocar-plano-dot">.</span>
        </h1>
        <p>Libere a troca de moeda e o controle total das suas finanças.</p>
      </div>

      {erro && <p className="erro-msg">{erro}</p>}

      <div className="trocar-plano-moeda-select">
        <label>Em qual moeda você quer organizar suas finanças? (com o plano premium você troca qualquer momento)</label>
        <select
          value={moedaSelecionada}
          onChange={(e) => setMoedaSelecionada(e.target.value)}
          disabled={salvando}
        >
          {MOEDAS.map((m) => (
            <option key={m.codigo} value={m.codigo}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="trocar-plano-grid">
        <div className="trocar-plano-card trocar-plano-card-destaque">
          <h2>Premium</h2>
          <p className="trocar-plano-preco">R$ 19,90<span>/mês</span></p>

          <ul className="trocar-plano-features">
            <li>
              <Check size={18} className="trocar-plano-icon-check" />
              Tudo do plano grátis
            </li>
            <li>
              <Check size={18} className="trocar-plano-icon-check" />
              Troque de moeda quando quiser
            </li>
            <li>
              <Check size={18} className="trocar-plano-icon-check" />
              Cotações atualizadas automaticamente
            </li>
            <li>
              <Check size={18} className="trocar-plano-icon-check" />
              Suporte prioritário
            </li>
          </ul>

          <button
            className="trocar-plano-btn trocar-plano-btn-primario"
            onClick={confirmarAssinatura}
            disabled={salvando}
          >
            <Crown size={18} />
            {salvando ? "Assinando..." : "Assinar Premium"}
          </button>
        </div>
      </div>

      <button
        className="trocar-plano-back-button"
        onClick={cancelarTroca}
        disabled={salvando}
      >
        <ArrowLeft size={16} /> Cancelar e voltar para Configurações
      </button>
    </div>
  );
}