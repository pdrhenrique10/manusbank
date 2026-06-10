import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Receitas.css";
import { Plus, X, Wallet, TrendingUp, DollarSign, Trash2, Pencil } from "lucide-react";
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
  if (typeof isoString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    return isoString;
  }
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
  const navigate = useNavigate();
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [receitas, setReceitas] = useState([]);
  const [novaReceita, setNovaReceita] = useState({
    nome: "",
    valor: "",
    data: new Date().toISOString().substring(0, 10),
  });
  const [receitaEditando, setReceitaEditando] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);

  const fecharModal = () => {
    setModalAberto(false);
    setNovaReceita({ nome: "", valor: "", data: new Date().toISOString().substring(0, 10) });
    setErro("");
  };

  const fecharModalEdicao = () => {
    setModalEdicaoAberto(false);
    setReceitaEditando(null);
    setErro("");
  };

  const carregarReceitas = useCallback(async (token) => {
    try {
      setCarregando(true);
      setErro("");
      setSucesso("");

      const resp = await fetch("http://localhost:3000/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) {
        if (resp.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        const receitasLocal = JSON.parse(localStorage.getItem('receitas') || '[]');
        setReceitas(receitasLocal);
        setCarregando(false);
        return;
      }

      const dados = await resp.json();
      const receitasBackend = (dados.transacoes || [])
        .filter(t => t.tipo === "deposito" || t.tipo === "transferenciaEntrada")
        .map(t => ({
          id: t.id,
          nome: t.descricao || "Receita",
          valor: Number(t.valor) || 0,
          data: extrairData(t.data),
        }));

      setReceitas(receitasBackend);
      localStorage.setItem('receitas', JSON.stringify(receitasBackend));
    } catch (e) {
      console.error("Erro ao carregar receitas:", e);
      const receitasLocal = JSON.parse(localStorage.getItem('receitas') || '[]');
      setReceitas(receitasLocal);
      setErro("Erro ao carregar receitas. Usando dados locais.");
    } finally {
      setCarregando(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    carregarReceitas(token);
  }, [navigate, carregarReceitas]);

  const dadosGrafico = receitas.map(r => ({
    nome: r.nome.length > 15 ? r.nome.substring(0, 15) + "..." : r.nome,
    valor: Number(r.valor) || 0,
  }));

  const totalReceitas = receitas.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaReceita(prev => ({ ...prev, [name]: value }));
  };

  const handleEdicaoChange = (e) => {
    const { name, value } = e.target;
    setReceitaEditando(prev => ({ ...prev, [name]: value }));
  };

  async function handleAdicionarReceita(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!novaReceita.nome || !novaReceita.valor || !novaReceita.data) {
      setErro("Preencha todos os campos!");
      return;
    }

    const valorNumero = parseFloat(String(novaReceita.valor).replace(",", "."));
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErro("Informe um valor válido maior que zero.");
      return;
    }

    const dataFormatada = novaReceita.data.substring(0, 10);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const novaReceitaObj = {
      id: Date.now(),
      nome: novaReceita.nome,
      valor: valorNumero,
      data: dataFormatada,
    };

    try {
      const resp = await fetch("http://localhost:3000/api/transacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
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
        setReceitas(prev => [...prev, novaReceitaObj]);
        const receitasAtualizadas = [...receitas, novaReceitaObj];
        localStorage.setItem('receitas', JSON.stringify(receitasAtualizadas));
        setSucesso("Receita salva localmente!");
        fecharModal();
        return;
      }

      const receita = {
        id: dados.transacao?.id ?? Date.now(),
        nome: novaReceita.nome,
        valor: valorNumero,
        data: dataFormatada,
      };
      setReceitas(prev => [...prev, receita]);
      const receitasAtualizadas = [...receitas, receita];
      localStorage.setItem('receitas', JSON.stringify(receitasAtualizadas));
      fecharModal();
      setSucesso("Receita salva com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar receita:", err);
      setReceitas(prev => [...prev, novaReceitaObj]);
      const receitasAtualizadas = [...receitas, novaReceitaObj];
      localStorage.setItem('receitas', JSON.stringify(receitasAtualizadas));
      setSucesso("Receita salva localmente (offline)!");
      fecharModal();
    }
  }

  async function handleRemoverReceita(id) {
    const confirmar = window.confirm("Tem certeza que deseja remover esta receita?");
    if (!confirmar) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`http://localhost:3000/api/transacao/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const dados = await resp.json();

      if (!resp.ok || !dados.sucesso) {
        setReceitas(prev => prev.filter(r => r.id !== id));
        const receitasAtualizadas = receitas.filter(r => r.id !== id);
        localStorage.setItem('receitas', JSON.stringify(receitasAtualizadas));
        setSucesso("Receita removida localmente!");
        return;
      }

      setReceitas(prev => prev.filter(r => r.id !== id));
      const receitasAtualizadas = receitas.filter(r => r.id !== id);
      localStorage.setItem('receitas', JSON.stringify(receitasAtualizadas));
      setSucesso("Receita removida com sucesso!");
    } catch (e) {
      console.error("Erro ao remover receita:", e);
      setReceitas(prev => prev.filter(r => r.id !== id));
      const receitasAtualizadas = receitas.filter(r => r.id !== id);
      localStorage.setItem('receitas', JSON.stringify(receitasAtualizadas));
      setSucesso("Receita removida localmente!");
    }
  }

  async function handleEditarReceita(e) {
    e.preventDefault();
    if (!receitaEditando) return;

    setErro("");
    setSucesso("");

    const valorNumero = parseFloat(String(receitaEditando.valor).replace(",", "."));
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErro("Informe um valor válido maior que zero.");
      return;
    }

    const dataFormatada = receitaEditando.data.substring(0, 10);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`http://localhost:3000/api/transacao/${receitaEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          valor: valorNumero,
          data: dataFormatada,
          descricao: receitaEditando.nome, // mantém o mesmo nome
          tipo: "deposito",
          categoria: receitaEditando.nome,
        }),
      });

      if (!resp.ok) {
        // Fallback: atualiza localmente mesmo se falhar
        const receitasAtualizadas = receitas.map(r =>
          r.id === receitaEditando.id
            ? { ...r, valor: valorNumero, data: dataFormatada }
            : r
        );
        setReceitas(receitasAtualizadas);
        localStorage.setItem('receitas', JSON.stringify(receitasAtualizadas));
        setSucesso("Receita atualizada localmente (offline)!");
        fecharModalEdicao();
        return;
      }

      const resultado = await resp.json();
      if (resultado.sucesso) {
        const receitasAtualizadas = receitas.map(r =>
          r.id === receitaEditando.id
            ? { ...r, valor: valorNumero, data: dataFormatada }
            : r
        );
        setReceitas(receitasAtualizadas);
        localStorage.setItem('receitas', JSON.stringify(receitasAtualizadas));
        setSucesso("Receita atualizada com sucesso!");
        fecharModalEdicao();
      } else {
        throw new Error("Falha na atualização");
      }
    } catch (err) {
      console.error("Erro ao editar receita:", err);
      // Atualiza localmente como fallback
      const receitasAtualizadas = receitas.map(r =>
        r.id === receitaEditando.id
          ? { ...r, valor: valorNumero, data: dataFormatada }
          : r
      );
      setReceitas(receitasAtualizadas);
      localStorage.setItem('receitas', JSON.stringify(receitasAtualizadas));
      setSucesso("Receita atualizada localmente (offline)!");
      fecharModalEdicao();
    }
  }

  const abrirModalEdicao = (receita) => {
    setReceitaEditando({
      id: receita.id,
      nome: receita.nome,
      valor: receita.valor,
      data: receita.data,
    });
    setModalEdicaoAberto(true);
  };

  if (carregando) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "20px" }}>Carregando...</main>
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
              <h1> Rendas Fixas</h1>
              <p className="subtitle">Gerencie suas rendas fixas de dinheiro.</p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}
            {sucesso && <p className="sucesso-msg">{sucesso}</p>}

            <div className="resumo-card">
              <div className="resumo-item">
                <DollarSign size={24} />
                <div>
                  <p className="resumo-label">Total de Receitas</p>
                  <p className="resumo-valor">
                    R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="resumo-item-secundario">
                <TrendingUp size={20} />
                <p className="resumo-secundario-label">{receitas.length} receitas cadastradas</p>
              </div>
            </div>

            <button className="btn-nova-receita" onClick={() => setModalAberto(true)}>
              <Plus size={20} /> Nova Renda
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
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        labelStyle={{ color: "#f8fafc" }}
                        formatter={(value) => ["R$ " + Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 }), "Valor"]}
                      />
                      <Bar dataKey="valor" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grafico-vazio"><p>Não há receitas cadastradas ainda</p></div>
                )}
              </div>
            </section>

            <section className="lista-receitas">
              <h2>Lista de Receitas</h2>
              <div className="lista-container">
                {receitas.length > 0 ? (
                  receitas.map(receita => (
                    <div key={receita.id} className="receita-item">
                      <div className="receita-info">
                        <h3>{receita.nome}</h3>
                        <p className="receita-data">{formatarData(receita.data)}</p>
                      </div>
                      <div className="receita-actions">
                        <p className="receita-valor">R$ {Number(receita.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        <button className="btn-editar-receita" onClick={() => abrirModalEdicao(receita)} title="Editar receita">
                          <Pencil size={16} />
                        </button>
                        <button className="btn-remover-receita" onClick={() => handleRemoverReceita(receita.id)} title="Remover receita">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="lista-vazia"><p>Nenhuma receita cadastrada</p></div>
                )}
              </div>
            </section>
          </div>

          {/* Modal de criação */}
          {modalAberto && (
            <div className="modal-overlay" onClick={fecharModal}>
              <div className="modal-conteudo" onClick={e => e.stopPropagation()}>
                <button className="modal-fechar" onClick={fecharModal}><X size={24} /></button>
                <h2>Nova Renda</h2>
                <form className="forma-receita" onSubmit={handleAdicionarReceita}>
                  <div className="form-group">
                    <label htmlFor="nome">Nome</label>
                    <input type="text" id="nome" name="nome" placeholder="Ex: Salário, Freelance..." autoComplete="off" value={novaReceita.nome} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="valor">Valor (R$)</label>
                    <input type="number" id="valor" name="valor" placeholder="0.00" step="0.01" min="0" autoComplete="off" value={novaReceita.valor} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="data">Data</label>
                    <input type="date" id="data" name="data" autoComplete="off" value={novaReceita.data} onChange={handleInputChange} />
                  </div>
                  <button type="submit" className="btn-salvar">Salvar Receita</button>
                </form>
              </div>
            </div>
          )}

          {/* Modal de edição */}
          {modalEdicaoAberto && receitaEditando && (
            <div className="modal-overlay" onClick={fecharModalEdicao}>
              <div className="modal-conteudo" onClick={e => e.stopPropagation()}>
                <button className="modal-fechar" onClick={fecharModalEdicao}><X size={24} /></button>
                <h2>Editar Renda</h2>
                <form className="forma-receita" onSubmit={handleEditarReceita}>
                  <div className="form-group">
                    <label>Nome</label>
                    <input type="text" value={receitaEditando.nome} disabled className="campo-desabilitado" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="valor-edicao">Valor (R$)</label>
                    <input type="number" id="valor-edicao" name="valor" step="0.01" min="0" value={receitaEditando.valor} onChange={handleEdicaoChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="data-edicao">Data</label>
                    <input type="date" id="data-edicao" name="data" value={receitaEditando.data} onChange={handleEdicaoChange} />
                  </div>
                  <button type="submit" className="btn-salvar">Atualizar Receita</button>
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