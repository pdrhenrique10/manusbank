import "./TrocarPlano.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowLeft, Crown } from "lucide-react";
import { API_URL } from "../../config/api";

export default function TrocarPlano() {
  const navigate = useNavigate();
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

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsed,
              plano: "premium",
            })
          );
        } catch (e) {
          // ignora
        }
      }

      navigate("/configuracoes", { state: { upgradeConcluido: true } });
    } catch (e) {
      console.error("Erro ao assinar premium:", e);
      setErro("Não foi possível assinar o Premium. Tente novamente.");
      setSalvando(false);
    }
  };

  const cancelarTroca = () => {
    navigate("/configuracoes");
  };

  return (
    <div className="trocar-plano-page">
      {/* Elementos visuais para preencher as laterais vazias */}
      <div className="bg-glow bg-glow-left"></div>
      <div className="bg-glow bg-glow-right"></div>

      <div className="trocar-plano-header">
        <h1>
          Assine o Premium<span className="trocar-plano-dot">.</span>
        </h1>
        <p>Libere metas ilimitadas e o histórico completo dos seus relatórios.</p>
      </div>

      {erro && <p className="erro-msg">{erro}</p>}

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
              Metas financeiras ilimitadas
            </li>
            <li>
              <Check size={18} className="trocar-plano-icon-check" />
              Histórico completo de relatórios, desde o cadastro
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