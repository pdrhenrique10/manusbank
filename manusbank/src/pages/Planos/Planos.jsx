import "./Planos.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";

const MOEDAS = [
  { codigo: "BRL", label: "Real (R$)" },
  { codigo: "USD", label: "Dólar (U$)" },
  { codigo: "EUR", label: "Euro (€)" },
  { codigo: "GBP", label: "Libra (£)" },
];

export default function Planos() {
  const navigate = useNavigate();
  const [moedaSelecionada, setMoedaSelecionada] = useState("BRL");

  const escolherPlano = (plano) => {
    navigate("/register", {
      state: { plano, moeda: moedaSelecionada },
    });
  };

  return (
    <div className="planos-page">
      <div className="planos-header">
        <h1>
          Escolha o plano ideal pra você<span className="planos-dot">.</span>
        </h1>
        <p>Comece grátis ou libere o controle total das suas finanças.</p>
      </div>

      <div className="planos-moeda-select">
        <label>Em qual moeda você organiza suas finanças?</label>
        <select
          value={moedaSelecionada}
          onChange={(e) => setMoedaSelecionada(e.target.value)}
        >
          {MOEDAS.map((m) => (
            <option key={m.codigo} value={m.codigo}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="planos-grid">
        {/* PLANO GRÁTIS */}
        <div className="plano-card">
          <h2>Grátis</h2>
          <p className="plano-preco">R$ 0<span>/sempre</span></p>

          <ul className="plano-features">
            <li>
              <Check size={18} className="icon-check" />
              Controle de receitas e despesas
            </li>
            <li>
              <Check size={18} className="icon-check" />
              Contas a pagar e receber
            </li>
            <li>
              <Check size={18} className="icon-check" />
              Metas financeiras
            </li>
            <li className="feature-limitada">
              <X size={18} className="icon-x" />
              Moeda fixa: <strong>{MOEDAS.find((m) => m.codigo === moedaSelecionada)?.label}</strong> (não pode trocar depois)
            </li>
          </ul>

          <button
            className="plano-btn plano-btn-secundario"
            onClick={() => escolherPlano("gratis")}
          >
            Começar grátis
          </button>
        </div>

        {/* PLANO PREMIUM */}
        <div className="plano-card plano-card-destaque">
          <span className="plano-badge">Mais popular</span>
          <h2>Premium</h2>
          <p className="plano-preco">R$ 19,90<span>/mês</span></p>

          <ul className="plano-features">
            <li>
              <Check size={18} className="icon-check" />
              Tudo do plano grátis
            </li>
            <li>
              <Check size={18} className="icon-check" />
              Troque de moeda quando quiser
            </li>
            <li>
              <Check size={18} className="icon-check" />
              Cotações atualizadas automaticamente
            </li>
            <li>
              <Check size={18} className="icon-check" />
              Suporte prioritário
            </li>
          </ul>

          <button
            className="plano-btn plano-btn-primario"
            onClick={() => escolherPlano("premium")}
          >
            Assinar Premium
          </button>
        </div>
      </div>
    </div>
  );
}