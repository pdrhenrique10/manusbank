import React, { useState } from "react";
import "./ContasPagar.css";
import { Plus, X, CreditCard, CalendarClock, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function ContasPagar() {
  const [modalAberto, setModalAberto] = useState(false);
  const [contas, setContas] = useState([]);
  const [novaConta, setNovaConta] = useState({
    fornecedor: "",
    valor: "",
    vencimento: "",
  });

  const dadosGrafico = contas.map((c) => ({
    nome: c.fornecedor,
    valor: c.valor,
  }));

  const totalPagar = contas.reduce((acc, c) => acc + c.valor, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaConta((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdicionarConta = (e) => {
    e.preventDefault();
    if (!novaConta.fornecedor || !novaConta.valor || !novaConta.vencimento) {
      alert("Preencha todos os campos!");
      return;
    }
    const conta = {
      id: Date.now(),
      fornecedor: novaConta.fornecedor,
      valor: parseFloat(novaConta.valor),
      vencimento: novaConta.vencimento,
    };
    setContas([...contas, conta]);
    setNovaConta({ fornecedor: "", valor: "", vencimento: "" });
    setModalAberto(false);
  };

  return (
    <main className="cp-container">
      <div className="cp-card">
        <header className="cp-header">
          <h1>
            <CreditCard size={32} />
            Contas a Pagar
          </h1>
          <p className="subtitle">Controle suas contas pendentes para pagar</p>
        </header>

        <div className="cp-resumo-card">
          <div className="cp-resumo-item">
            <AlertTriangle size={24} />
            <div>
              <p className="cp-resumo-label">Total a Pagar</p>
              <p className="cp-resumo-valor">
                R$ {totalPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="cp-resumo-item-secundario">
            <CalendarClock size={20} />
            <p className="cp-resumo-secundario-label">
              {contas.length} contas cadastradas
            </p>
          </div>
        </div>

        <button className="cp-btn-nova" onClick={() => setModalAberto(true)}>
          <Plus size={20} />
          Nova Conta a Pagar
        </button>

        <section className="cp-grafico-section">
          <h2>Contas por Fornecedor</h2>
          <div className="cp-grafico-container">
            {contas.length > 0 ? (
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
                  <Bar dataKey="valor" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="cp-grafico-vazio">
                <p>Não há contas a pagar cadastradas ainda</p>
              </div>
            )}
          </div>
        </section>

        <section className="cp-lista">
          <h2>Lista de Contas a Pagar</h2>
          <div className="cp-lista-container">
            {contas.length > 0 ? (
              contas.map((conta) => (
                <div key={conta.id} className="cp-item">
                  <div className="cp-info">
                    <h3>{conta.fornecedor}</h3>
                    <p className="cp-data">
                      Vencimento:{" "}
                      {new Date(conta.vencimento).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p className="cp-valor">
                    R$ {conta.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))
            ) : (
              <div className="cp-lista-vazia">
                <p>Nenhuma conta cadastrada</p>
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
            <h2>Nova Conta a Pagar</h2>
            <form className="cp-form" onSubmit={handleAdicionarConta}>
              <div className="form-group">
                <label htmlFor="fornecedor">Fornecedor</label>
                <input
                  type="text"
                  id="fornecedor"
                  name="fornecedor"
                  placeholder="Ex: Energia, Internet..."
                  value={novaConta.fornecedor}
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
                  value={novaConta.valor}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="vencimento">Vencimento</label>
                <input
                  type="date"
                  id="vencimento"
                  name="vencimento"
                  value={novaConta.vencimento}
                  onChange={handleInputChange}
                />
              </div>
              <button type="submit" className="btn-salvar">
                Salvar Conta
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default ContasPagar;