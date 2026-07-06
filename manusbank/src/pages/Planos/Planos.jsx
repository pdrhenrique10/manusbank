import "./Planos.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowLeft } from "lucide-react";

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
      {/* Elementos visuais para preencher as laterais vazias (Agora dentro do contêiner pai) */}
      <div className="bg-glow bg-glow-left"></div> 
      <div className="bg-glow bg-glow-right"></div>

      {/* CABEÇALHO */}
      <div className="planos-header">
        <h1>
          Escolha o plano ideal pra você<span className="planos-dot">.</span>
        </h1>
        <p>Comece grátis ou libere o controle total das suas finanças.</p>
      </div>

      {/* GRID APENAS COM OS CARDS */}
      <div className="planos-grid">
        {/* PLANO GRÁTIS */}
        <div className="plano-card">
          <h2>Grátis</h2>
          <p className="plano-preco">R$ 0<span>/sempre</span></p>

          <ul className="plano-features">
            <li>
              <Check size={18} className="icon-check" />
              Todo o essencial para organizar suas finanças
            </li>
            <li>
              <Check size={18} className="icon-check" />
              Seleção de idioma
            </li>
            <li>
              <Check size={18} className="icon-check" />
              Até 3 metas financeiras
            </li>
            <li>
              <Check size={18} className="icon-check" />
              Histórico de relatórios dos últimos 3 meses
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
          <h2>Premium</h2>
          <p className="plano-preco">R$ 19,90<span>/mês</span></p>

          <ul className="plano-features">
            <li>
              <Check size={18} className="icon-check" />
              Tudo do plano grátis
            </li>
            <li>
              <Check size={18} className="icon-check" />
              Metas financeiras ilimitadas
            </li>
            <li>
              <Check size={18} className="icon-check" />
              Histórico completo de relatórios, desde o cadastro
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

      {/* BOTÃO VOLTAR */}
      <button className="back-home-button" onClick={() => navigate("/")}>
        <ArrowLeft size={16} /> Voltar à tela inicial
      </button>
    </div>
  );
}