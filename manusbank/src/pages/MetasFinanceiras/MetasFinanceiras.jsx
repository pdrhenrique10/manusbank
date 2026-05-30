import React, { useState } from "react";
import "./MetasFinanceiras.css";
import { Plus, X, Target, CalendarClock, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function MetasFinanceiras() {
  const [modalAberto, setModalAberto] = useState(false);
  const [metas, setMetas] = useState([]);
  const [novaMeta, setNovaMeta] = useState({
    nome: "",
    objetivo: "",
    valorAtual: "",
    prazo: "",
  });

  const dadosGrafico = metas.map((m) => ({
    nome: m.nome,
    progresso: m.objetivo > 0 ? Math.min(100, (m.valorAtual / m.objetivo) * 100) : 0,
  }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaMeta((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdicionarMeta = (e) => {
    e.preventDefault();
    if (!novaMeta.nome || !novaMeta.objetivo || !novaMeta.prazo) {
      alert("Preencha pelo menos nome, objetivo e prazo!");
      return;
    }
    const meta = {
      id: Date.now(),
      nome: novaMeta.nome,
      objetivo: parseFloat(novaMeta.objetivo),
      valorAtual: novaMeta.valorAtual ? parseFloat(novaMeta.valorAtual) : 0,
      prazo: novaMeta.prazo,
    };
    setMetas([...metas, meta]);
    setNovaMeta({ nome: "", objetivo: "", valorAtual: "", prazo: "" });
    setModalAberto(false);
  };

  const metasConcluidas = metas.filter(
    (m) => m.objetivo > 0 && m.valorAtual >= m.objetivo
  ).length;

  return (
    <main className="mf-container">
      <div className="mf-card">
        <header className="mf-header">
          <h1>
            <Target size={32} />
            Metas Financeiras
          </h1>
          <p className="subtitle">Defina e acompanhe suas metas de dinheiro</p>
        </header>

        <div className="mf-resumo-card">
          <div className="mf-resumo-item">
            <TrendingUp size={24} />
            <div>
              <p className="mf-resumo-label">Total de Metas</p>
              <p className="mf-resumo-valor">{metas.length}</p>
            </div>
          </div>
          <div className="mf-resumo-item-secundario">
            <CalendarClock size={20} />
            <p className="mf-resumo-secundario-label">
              {metasConcluidas} metas concluídas
            </p>
          </div>
        </div>

        <button className="mf-btn-nova" onClick={() => setModalAberto(true)}>
          <Plus size={20} />
          Nova Meta
        </button>

        <section className="mf-grafico-section">
          <h2>Progresso das Metas (%)</h2>
          <div className="mf-grafico-container">
            {metas.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nome" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f8fafc" }}
                    formatter={(value) => [value.toFixed(1) + "%", "Progresso"]}
                  />
                  <Bar dataKey="progresso" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="mf-grafico-vazio">
                <p>Não há metas cadastradas ainda</p>
              </div>
            )}
          </div>
        </section>

        <section className="mf-lista">
          <h2>Lista de Metas</h2>
          <div className="mf-lista-container">
            {metas.length > 0 ? (
              metas.map((meta) => {
                const progresso =
                  meta.objetivo > 0
                    ? Math.min(100, (meta.valorAtual / meta.objetivo) * 100)
                    : 0;
                return (
                  <div key={meta.id} className="mf-item">
                    <div className="mf-info">
                      <h3>{meta.nome}</h3>
                      <p className="mf-data">
                        Prazo: {new Date(meta.prazo).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="mf-valores">
                        R$ {meta.valorAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
                        de R$ {meta.objetivo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="mf-progresso-badge">
                      {progresso.toFixed(0)}%
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="mf-lista-vazia">
                <p>Nenhuma meta cadastrada</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
            <button className="modal-fechar" onClick={() => setModalAberto(false)}>
              <X size={24} />
            </button>
            <h2>Nova Meta Financeira</h2>
            <form className="mf-form" onSubmit={handleAdicionarMeta}>
              <div className="form-group">
                <label htmlFor="nome">Nome da Meta</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  placeholder="Ex: Reserva de emergência"
                  value={novaMeta.nome}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="objetivo">Valor objetivo (R$)</label>
                <input
                  type="number"
                  id="objetivo"
                  name="objetivo"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={novaMeta.objetivo}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="valorAtual">Valor atual (R$)</label>
                <input
                  type="number"
                  id="valorAtual"
                  name="valorAtual"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={novaMeta.valorAtual}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="prazo">Prazo</label>
                <input
                  type="date"
                  id="prazo"
                  name="prazo"
                  value={novaMeta.prazo}
                  onChange={handleInputChange}
                />
              </div>
              <button type="submit" className="btn-salvar">
                Salvar Meta
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default MetasFinanceiras;