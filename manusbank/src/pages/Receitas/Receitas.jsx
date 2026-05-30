import React, { useState } from "react";
import "./Receitas.css";
import { Plus, X, Wallet, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function Receitas() {
  const [modalAberto, setModalAberto] = useState(false);
  const [receitas, setReceitas] = useState([]);
  const [novaReceita, setNovaReceita] = useState({
    nome: "",
    valor: "",
    data: "",
  });

  const dadosGrafico = receitas.map((r) => ({
    nome: r.nome,
    valor: r.valor,
  }));

  const totalReceitas = receitas.reduce((acc, r) => acc + r.valor, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaReceita((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdicionarReceita = (e) => {
    e.preventDefault();
    if (!novaReceita.nome || !novaReceita.valor || !novaReceita.data) {
      alert("Preencha todos os campos!");
      return;
    }
    const receita = {
      id: Date.now(),
      nome: novaReceita.nome,
      valor: parseFloat(novaReceita.valor),
      data: novaReceita.data,
    };
    setReceitas([...receitas, receita]);
    setNovaReceita({ nome: "", valor: "", data: "" });
    setModalAberto(false);
  };

  return (
    <main className="receitas-container">
      <div className="receitas-card">
        <header className="receitas-header">
          <h1>
            <Wallet size={32} />
            Receitas
          </h1>
          <p className="subtitle">Gerencie suas entradas de dinheiro</p>
        </header>

        <div className="resumo-card">
          <div className="resumo-item">
            <DollarSign size={24} />
            <div>
              <p className="resumo-label">Total de Receitas</p>
              <p className="resumo-valor">R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="resumo-item-secundario">
            <TrendingUp size={20} />
            <p className="resumo-secundario-label">{receitas.length} receitas cadastradas</p>
          </div>
        </div>

        <button className="btn-nova-receita" onClick={() => setModalAberto(true)}>
          <Plus size={20} />
          Nova Receita
        </button>

        <section className="grafico-section">
          <h2>Receitas por Categoria</h2>
          <div className="grafico-container">
            {receitas.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nome" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f8fafc" }}
                    formatter={(value) => ["R$ " + value.toLocaleString("pt-BR"), "Valor"]}
                  />
                  <Bar dataKey="valor" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grafico-vazio">
                <p>Não há receitas cadastradas ainda</p>
              </div>
            )}
          </div>
        </section>

        <section className="lista-receitas">
          <h2>Lista de Receitas</h2>
          <div className="lista-container">
            {receitas.length > 0 ? (
              receitas.map((receita) => (
                <div key={receita.id} className="receita-item">
                  <div className="receita-info">
                    <h3>{receita.nome}</h3>
                    <p className="receita-data">{new Date(receita.data).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <p className="receita-valor">R$ {receita.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              ))
            ) : (
              <div className="lista-vazia">
                <p>Nenhuma receita cadastrada</p>
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
            <h2>Nova Receita</h2>
            <form className="forma-receita" onSubmit={handleAdicionarReceita}>
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  placeholder="Ex: Salario, Freelance..."
                  value={novaReceita.nome}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="valor">Valor (R$)</label>
                <input
                  type="number"
                  id="valor"
                  name="valor"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={novaReceita.valor}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="data">Data</label>
                <input
                  type="date"
                  id="data"
                  name="data"
                  value={novaReceita.data}
                  onChange={handleInputChange}
                />
              </div>
              <button type="submit" className="btn-salvar">
                Salvar Receita
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Receitas;