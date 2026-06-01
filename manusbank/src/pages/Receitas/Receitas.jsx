import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Receitas.css";
import { Plus, X, Wallet, TrendingUp, DollarSign, Trash2 } from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function extrairData(isoString) {
  if (!isoString) return new Date().toISOString().substring(0, 10);
  
  // Se já estiver no formato YYYY-MM-DD, retorna direto
  if (typeof isoString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    return isoString;
  }
  
  // Converte data ISO garantindo o fuso correto
  const d = new Date(isoString + 'T00:00:00');
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  if (!data) return "-";
  const [ano, mes, dia] = data.substring(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function Receitas() {
  const [modalAberto, setModalAberto] = useState(false);
  const [receitas, setReceitas] = useState([]);
  const [novaReceita, setNovaReceita] = useState({
    nome: "",
    valor: "",
    data: new Date().toISOString().substring(0, 10),
  });
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarReceitas() {
      try {
        setCarregando(true);
        setErro("");
        setSucesso("");

        const resp = await fetch("http://localhost:3000/api/dashboard");
        if (!resp.ok) {
          window.location.href = "/login";
          return;
        }

        const dados = await resp.json();

        const receitasBackend = (dados.transacoes || [])
          .filter(
            (t) =>
              t.tipo === "deposito" || t.tipo === "transferenciaEntrada"
          )
          .map((t) => ({
            id: t.id,
            nome: t.descricao || "Receita",
            valor: Number(t.valor) || 0,
            data: extrairData(t.data),
          }));

        setReceitas(receitasBackend);
      } catch (e) {
        console.error("Erro ao carregar receitas:", e);
        setErro("Erro ao carregar receitas.");
      } finally {
        setCarregando(false);
      }
    }

    carregarReceitas();
  }, []);

  const dadosGrafico = receitas.map((r) => ({
    nome: r.nome,
    valor: Number(r.valor) || 0,
  }));

  const totalReceitas = receitas.reduce(
    (acc, r) => acc + (Number(r.valor) || 0),
    0
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaReceita((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function handleAdicionarReceita(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!novaReceita.nome || !novaReceita.valor || !novaReceita.data) {
      setErro("Preencha todos os campos!");
      return;
    }

    const valorNumero = parseFloat(
      String(novaReceita.valor).replace(",", ".")
    );
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErro("Informe um valor válido maior que zero.");
      return;
    }

    try {
      // Garante que a data está no formato YYYY-MM-DD
      const dataFormatada = novaReceita.data.substring(0, 10);
      
      const resp = await fetch("http://localhost:3000/api/transacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "deposito",
          valor: valorNumero,
          descricao: novaReceita.nome,
          data: dataFormatada,
          categoria: novaReceita.nome,
        }),
      });

      const dados = await resp.json();

      if (!resp.ok || !dados.sucesso) {
        setErro(dados.erro || "Erro ao salvar receita.");
        return;
      }

      const receita = {
        id: dados.transacao?.id ?? Date.now(),
        nome: novaReceita.nome,
        valor: valorNumero,
        data: dataFormatada,
      };

      setReceitas((anteriores) => [...anteriores, receita]);
      setNovaReceita({ nome: "", valor: "", data: new Date().toISOString().substring(0, 10) });
      setModalAberto(false);
      setSucesso("Receita salva com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar receita:", err);
      setErro("Erro ao conectar com o servidor.");
    }
  }

  async function handleRemoverReceita(id) {
    const confirmar = window.confirm(
      "Tem certeza que deseja remover esta receita?"
    );
    if (!confirmar) return;

    try {
      const resp = await fetch(`http://localhost:3000/api/transacao/${id}`, {
        method: "DELETE",
      });

      const dados = await resp.json();

      if (!resp.ok || !dados.sucesso) {
        setErro(dados.erro || "Erro ao remover receita.");
        return;
      }

      setReceitas((anteriores) => anteriores.filter((r) => r.id !== id));
      setSucesso("Receita removida com sucesso!");
    } catch (e) {
      console.error("Erro ao remover receita:", e);
      setErro("Erro ao conectar com o servidor.");
    }
  }

  if (carregando) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "20px" }}>
          <p>Carregando receitas...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "20px" }}>
        <div className="receitas-container">
          <div className="receitas-card">
            <header className="receitas-header">
              <h1>
                <Wallet size={32} />
                Receitas
              </h1>
              <p className="subtitle">Gerencie suas entradas de dinheiro</p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}
            {sucesso && <p className="sucesso-msg">{sucesso}</p>}

            <div className="resumo-card">
              <div className="resumo-item">
                <DollarSign size={24} />
                <div>
                  <p className="resumo-label">Total de Receitas</p>
                  <p className="resumo-valor">
                    R{"$ "}
                    {totalReceitas.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="resumo-item-secundario">
                <TrendingUp size={20} />
                <p className="resumo-secundario-label">
                  {receitas.length} receitas cadastradas
                </p>
              </div>
            </div>

            <button
              className="btn-nova-receita"
              onClick={() => setModalAberto(true)}
            >
              <Plus size={20} />
              Nova Receita
            </button>

            <section className="grafico-section">
              <h2>Receitas por Categoria</h2>
              <div className="grafico-container">
                {receitas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />
                      <XAxis dataKey="nome" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          background: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#f8fafc" }}
                        formatter={(value) => [
                          "R$ " +
                            Number(value).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            }),
                          "Valor",
                        ]}
                      />
                      <Bar
                        dataKey="valor"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
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
                  receitas.map((receita) => {
                    const dataFormatada = formatarData(receita.data);

                    return (
                      <div key={receita.id} className="receita-item">
                        <div className="receita-info">
                          <h3>{receita.nome}</h3>
                          <p className="receita-data">{dataFormatada}</p>
                        </div>
                        <div className="receita-actions">
                          <p className="receita-valor">
                            R{"$ "}
                            {Number(receita.valor || 0).toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                              }
                            )}
                          </p>
                          <button
                            className="btn-remover-receita"
                            onClick={() =>
                              handleRemoverReceita(receita.id)
                            }
                            title="Remover receita"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="lista-vazia">
                    <p>Nenhuma receita cadastrada</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {modalAberto && (
            <div
              className="modal-overlay"
              onClick={() => setModalAberto(false)}
            >
              <div
                className="modal-conteudo"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="modal-fechar"
                  onClick={() => setModalAberto(false)}
                >
                  <X size={24} />
                </button>
                <h2>Nova Receita</h2>
                <form
                  className="forma-receita"
                  onSubmit={handleAdicionarReceita}
                >
                  <div className="form-group">
                    <label htmlFor="nome">Nome</label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      placeholder="Ex: Salário, Freelance..."
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
        </div>
      </main>
    </div>
  );
}

export default Receitas;