import React, { useState } from "react";
import "./ContasReceber.css";
import { Plus, X, WalletCards, CalendarClock, BadgeDollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function ContasReceber() {
  const [modalAberto, setModalAberto] = useState(false);
  const [contas, setContas] = useState([]);
  const [novaConta, setNovaConta] = useState({
    cliente: "",
    valor: "",
    vencimento: "",
  });

  const dadosGrafico = contas.map((c) => ({
    nome: c.cliente,
    valor: c.valor,
  }));

  const totalAberto = contas.reduce((acc, c) => acc + c.valor, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaConta((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdicionarConta = (e) => {
    e.preventDefault();
    if (!novaConta.cliente || !novaConta.valor || !novaConta.vencimento) {
      alert("Preencha todos os campos!");
      return;
    }
    const conta = {
      id: Date.now(),
      cliente: novaConta.cliente,
      valor: parseFloat(novaConta.valor),
      vencimento: novaConta.vencimento,
    };
    setContas([...contas, conta]);
    setNovaConta({ cliente: "", valor: "", vencimento: "" });
    setModalAberto(false);
  };

  return (
    <main className="cr-container">
      <div className="cr-card">
        <header className="cr-header">
          <h1>
            <WalletCards size={32} />
            Contas a Receber
          </h1>
          <p className="subtitle">Controle seus recebimentos pendentes</p>
        </header>

        <div className="cr-resumo-card">
          <div className="cr-resumo-item">
            <BadgeDollarSign size={24} />
            <div>
              <p className="cr-resumo-label">Total em Aberto</p>
              <p className="cr-resumo-valor">
                R$ {totalAberto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="cr-resumo-item-secundario">
            <CalendarClock size={20} />
            <p className="cr-resumo-secundario-label">
              {contas.length} contas cadastradas
            </p>
          </div>
        </div>

        <button className="cr-btn-nova" onClick={() => setModalAberto(true)}>
          <Plus size={20} />
          Nova Conta a Receber
        </button>

        <section className="cr-grafico-section">
          <h2>Contas por Cliente</h2>
          <div className="cr-grafico-container">
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
                  <Bar dataKey="valor" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="cr-grafico-vazio">
                <p>Não há contas a receber cadastradas ainda</p>
              </div>
            )}
          </div>
        </section>

        <section className="cr-lista">
          <h2>Lista de Contas a Receber</h2>
          <div className="cr-lista-container">
            {contas.length > 0 ? (
              contas.map((conta) => (
                <div key={conta.id} className="cr-item">
                  <div className="cr-info">
                    <h3>{conta.cliente}</h3>
                    <p className="cr-data">
                      Vencimento:{" "}
                      {new Date(conta.vencimento).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p className="cr-valor">
                    R$ {conta.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))
            ) : (
              <div className="cr-lista-vazia">
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
            <h2>Nova Conta a Receber</h2>
            <form className="cr-form" onSubmit={handleAdicionarConta}>
              <div className="form-group">
                <label htmlFor="cliente">Cliente</label>
                <input
                  type="text"
                  id="cliente"
                  name="cliente"
                  placeholder="Nome do cliente"
                  value={novaConta.cliente}
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

export default ContasReceber;