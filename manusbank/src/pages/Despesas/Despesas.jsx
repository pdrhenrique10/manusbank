import React, { useState } from "react";
import "./Despesas.css";
import { Plus, X, Wallet, TrendingDown, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function Despesas() {
  const [modalAberto, setModalAberto] = useState(false);
  const [despesas, setDespesas] = useState([]);
  const [novaDespesa, setNovaDespesa] = useState({
    nome: "",
    valor: "",
    data: "",
  });

  const dadosGrafico = despesas.map((d) => ({
    nome: d.nome,
    valor: d.valor,
  }));

  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaDespesa((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdicionarDespesa = (e) => {
    e.preventDefault();
    if (!novaDespesa.nome || !novaDespesa.valor || !novaDespesa.data) {
      alert("Preencha todos os campos!");
      return;
    }
    const despesa = {
      id: Date.now(),
      nome: novaDespesa.nome,
      valor: parseFloat(novaDespesa.valor),
      data: novaDespesa.data,
    };
    setDespesas([...despesas, despesa]);
    setNovaDespesa({ nome: "", valor: "", data: "" });
    setModalAberto(false);
  };

  return (
    <main className="despesas-container">
      <div className="despesas-card">
        <header className="despesas-header">
          <h1>
            <Wallet size={32} />
            Despesas
          </h1>
          <p className="subtitle">Gerencie suas saídas de dinheiro</p>
        </header>

        <div className="resumo-card">
          <div className="resumo-item">
            <CreditCard size={24} />
            <div>
              <p className="resumo-label">Total de Despesas</p>
              <p className="resumo-valor">
                R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="resumo-item-secundario">
            <TrendingDown size={20} />
            <p className="resumo-secundario-label">
              {despesas.length} despesas cadastradas
            </p>
          </div>
        </div>

        <button className="btn-nova-despesa" onClick={() => setModalAberto(true)}>
          <Plus size={20} />
          Nova Despesa
        </button>

        <section className="grafico-section">
          <h2>Despesas por Categoria</h2>
          <div className="grafico-container">
            {despesas.length > 0 ? (
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
                  <Bar dataKey="valor" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grafico-vazio">
                <p>Não há despesas cadastradas ainda</p>
              </div>
            )}
          </div>
        </section>

        <section className="lista-despesas">
          <h2>Lista de Despesas</h2>
          <div className="lista-container">
            {despesas.length > 0 ? (
              despesas.map((despesa) => (
                <div key={despesa.id} className="despesa-item">
                  <div className="despesa-info">
                    <h3>{despesa.nome}</h3>
                    <p className="despesa-data">
                      {new Date(despesa.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p className="despesa-valor">
                    R$ {despesa.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))
            ) : (
              <div className="lista-vazia">
                <p>Nenhuma despesa cadastrada</p>
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
            <h2>Nova Despesa</h2>
            <form className="forma-despesa" onSubmit={handleAdicionarDespesa}>
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  placeholder="Ex: Mercado, Aluguel..."
                  value={novaDespesa.nome}
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
                  value={novaDespesa.valor}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="data">Data</label>
                <input
                  type="date"
                  id="data"
                  name="data"
                  value={novaDespesa.data}
                  onChange={handleInputChange}
                />
              </div>
              <button type="submit" className="btn-salvar">
                Salvar Despesa
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Despesas;