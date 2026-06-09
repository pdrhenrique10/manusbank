import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./MetasFinanceiras.css";
import { Plus, X, Target, CalendarClock, TrendingUp, Trash2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function MetasFinanceiras() {
  const navigate = useNavigate();
  const [modalAberto, setModalAberto] = useState(false);
  const [metas, setMetas] = useState([]);
  const [novaMeta, setNovaMeta] = useState({
    titulo: "",
    valorAlvo: "",
    dataMeta: "",
    descricao: "",
  });
  const [valorAporte, setValorAporte] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);

  // Verificar autenticação e carregar metas
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    carregarMetas(token);
  }, [navigate]);

  async function carregarMetas(token) {
    try {
      setCarregando(true);
      setErro("");
      setSucesso("");

      const resp = await fetch("http://localhost:3000/api/metas", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resp.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!resp.ok) {
        // Fallback: carregar do localStorage
        const metasLocal = JSON.parse(localStorage.getItem('metasFinanceiras') || '[]');
        setMetas(metasLocal);
        setCarregando(false);
        return;
      }

      const dados = await resp.json();
      setMetas(dados || []);
      localStorage.setItem('metasFinanceiras', JSON.stringify(dados || []));
    } catch (e) {
      console.error("Erro ao carregar metas:", e);
      const metasLocal = JSON.parse(localStorage.getItem('metasFinanceiras') || '[]');
      setMetas(metasLocal);
      setErro("Erro ao carregar metas. Usando dados locais.");
    } finally {
      setCarregando(false);
    }
  }

  // Limpar mensagens após 3 segundos
  useEffect(() => {
    if (sucesso) {
      const timer = setTimeout(() => setSucesso(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [sucesso]);

  // Dados do gráfico: progresso em %
  const dadosGrafico = metas.map((m) => {
    const objetivo = Number(m.valorAlvo) || 0;
    const atual = Number(m.valorAtual) || 0;
    const progresso = objetivo > 0 ? Math.min(100, (atual / objetivo) * 100) : 0;
    return {
      nome: m.titulo.length > 15 ? m.titulo.substring(0, 15) + "..." : m.titulo,
      progresso,
    };
  });

  const metasConcluidas = metas.filter((m) => {
    const objetivo = Number(m.valorAlvo) || 0;
    const atual = Number(m.valorAtual) || 0;
    return objetivo > 0 && atual >= objetivo;
  }).length;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaMeta(prev => ({ ...prev, [name]: value }));
  };

  const handleAdicionarMeta = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!novaMeta.titulo || !novaMeta.valorAlvo || !novaMeta.dataMeta) {
      setErro("Preencha título, valor objetivo e data da meta!");
      return;
    }

    const valorNumero = parseFloat(String(novaMeta.valorAlvo).replace(",", "."));
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErro("Informe um valor válido maior que zero.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const novaMetaObj = {
      id: Date.now(),
      titulo: novaMeta.titulo,
      valorAlvo: valorNumero,
      valorAtual: 0,
      dataMeta: novaMeta.dataMeta,
      descricao: novaMeta.descricao,
    };

    try {
      const body = {
        titulo: novaMeta.titulo,
        valorAlvo: valorNumero,
        dataMeta: novaMeta.dataMeta,
        descricao: novaMeta.descricao,
      };

      const resp = await fetch("http://localhost:3000/api/metas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        // Fallback local
        setMetas(prev => [...prev, novaMetaObj]);
        const metasAtualizadas = [...metas, novaMetaObj];
        localStorage.setItem('metasFinanceiras', JSON.stringify(metasAtualizadas));
        setSucesso("Meta salva localmente!");
        setModalAberto(false);
        setNovaMeta({ titulo: "", valorAlvo: "", dataMeta: "", descricao: "" });
        return;
      }

      const criada = await resp.json();
      setMetas(prev => [...prev, criada]);
      const metasAtualizadas = [...metas, criada];
      localStorage.setItem('metasFinanceiras', JSON.stringify(metasAtualizadas));
      setNovaMeta({ titulo: "", valorAlvo: "", dataMeta: "", descricao: "" });
      setModalAberto(false);
      setSucesso("Meta adicionada com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar meta:", e);
      setMetas(prev => [...prev, novaMetaObj]);
      const metasAtualizadas = [...metas, novaMetaObj];
      localStorage.setItem('metasFinanceiras', JSON.stringify(metasAtualizadas));
      setSucesso("Meta salva localmente (offline)!");
      setModalAberto(false);
      setNovaMeta({ titulo: "", valorAlvo: "", dataMeta: "", descricao: "" });
    }
  };

  const handleAportar = async (metaId) => {
    if (!valorAporte) {
      setErro("Digite um valor para aportar.");
      return;
    }

    const valorNumero = parseFloat(String(valorAporte).replace(",", "."));
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErro("Informe um valor válido maior que zero.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`http://localhost:3000/api/metas/${metaId}/aportar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ valor: valorNumero }),
      });

      if (!resp.ok) {
        // Fallback local
        setMetas(prev =>
          prev.map(m => m.id === metaId ? { ...m, valorAtual: (m.valorAtual || 0) + valorNumero } : m)
        );
        const metasAtualizadas = metas.map(m =>
          m.id === metaId ? { ...m, valorAtual: (m.valorAtual || 0) + valorNumero } : m
        );
        localStorage.setItem('metasFinanceiras', JSON.stringify(metasAtualizadas));
        setSucesso(`Aporte de R$ ${valorNumero.toFixed(2)} realizado localmente!`);
        setValorAporte("");
        return;
      }

      const { meta } = await resp.json();
      setMetas(prev => prev.map(m => (m.id === meta.id ? meta : m)));
      const metasAtualizadas = metas.map(m => (m.id === meta.id ? meta : m));
      localStorage.setItem('metasFinanceiras', JSON.stringify(metasAtualizadas));
      setSucesso(`Aporte de R$ ${valorNumero.toFixed(2)} realizado!`);
      setValorAporte("");
    } catch (e) {
      console.error("Erro ao aportar na meta:", e);
      setErro("Não foi possível registrar o aporte.");
    }
  };

  const handleTirarAporte = async (metaId) => {
    if (!valorAporte) {
      setErro("Digite um valor para tirar da meta.");
      return;
    }

    const valorNumero = parseFloat(String(valorAporte).replace(",", "."));
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErro("Informe um valor válido maior que zero.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`http://localhost:3000/api/metas/${metaId}/desaportar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ valor: valorNumero }),
      });

      if (!resp.ok) {
        // Fallback local
        setMetas(prev =>
          prev.map(m =>
            m.id === metaId ? { ...m, valorAtual: Math.max(0, (m.valorAtual || 0) - valorNumero) } : m
          )
        );
        const metasAtualizadas = metas.map(m =>
          m.id === metaId ? { ...m, valorAtual: Math.max(0, (m.valorAtual || 0) - valorNumero) } : m
        );
        localStorage.setItem('metasFinanceiras', JSON.stringify(metasAtualizadas));
        setSucesso(`R$ ${valorNumero.toFixed(2)} retirado da meta localmente!`);
        setValorAporte("");
        return;
      }

      const { meta } = await resp.json();
      setMetas(prev => prev.map(m => (m.id === meta.id ? meta : m)));
      const metasAtualizadas = metas.map(m => (m.id === meta.id ? meta : m));
      localStorage.setItem('metasFinanceiras', JSON.stringify(metasAtualizadas));
      setSucesso(`R$ ${valorNumero.toFixed(2)} retirado da meta!`);
      setValorAporte("");
    } catch (e) {
      console.error("Erro ao tirar aporte da meta:", e);
      setErro("Não foi possível tirar o aporte.");
    }
  };

  const handleRemoverMeta = async (id) => {
    const confirmar = window.confirm("Tem certeza que deseja remover esta meta financeira?");
    if (!confirmar) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const resp = await fetch(`http://localhost:3000/api/metas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const dados = await resp.json();

      if (!resp.ok || !dados.sucesso) {
        // Fallback local
        setMetas(prev => prev.filter(m => m.id !== id));
        const metasAtualizadas = metas.filter(m => m.id !== id);
        localStorage.setItem('metasFinanceiras', JSON.stringify(metasAtualizadas));
        setSucesso("Meta removida localmente!");
        return;
      }

      setMetas(prev => prev.filter(m => m.id !== id));
      const metasAtualizadas = metas.filter(m => m.id !== id);
      localStorage.setItem('metasFinanceiras', JSON.stringify(metasAtualizadas));
      setSucesso("Meta removida com sucesso!");
    } catch (e) {
      console.error("Erro ao remover meta:", e);
      setMetas(prev => prev.filter(m => m.id !== id));
      const metasAtualizadas = metas.filter(m => m.id !== id);
      localStorage.setItem('metasFinanceiras', JSON.stringify(metasAtualizadas));
      setSucesso("Meta removida localmente!");
    }
  };

  if (carregando) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "20px" }}>Carregando metas...</main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "20px" }}>
        <div className="mf-container">
          <div className="mf-card">
            <header className="mf-header">
              <h1>
                Metas Financeiras
              </h1>
              <p className="subtitle">Defina e acompanhe suas metas materiais.</p>
            </header>

            {erro && <p className="erro-msg">{erro}</p>}
            {sucesso && <p className="sucesso-msg">{sucesso}</p>}

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
                <p className="mf-resumo-secundario-label">{metasConcluidas} metas concluídas</p>
              </div>
            </div>

            <button className="mf-btn-nova" onClick={() => setModalAberto(true)}>
              <Plus size={20} /> Nova Meta
            </button>

            <section className="mf-grafico-section">
              <h2>Progresso das Metas (%)</h2>
              <div className="mf-grafico-container">
                {carregando ? (
                  <div className="mf-grafico-vazio"><p>Carregando metas...</p></div>
                ) : metas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="nome" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        labelStyle={{ color: "#f8fafc" }}
                        formatter={(value) => [Number(value).toFixed(1) + "%", "Progresso"]}
                      />
                      <Bar dataKey="progresso" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="mf-grafico-vazio"><p>Não há metas cadastradas ainda</p></div>
                )}
              </div>
            </section>

            <section className="mf-lista">
              <h2>Lista de Metas</h2>
              <div className="mf-lista-container">
                {carregando ? (
                  <div className="mf-lista-vazia"><p>Carregando metas...</p></div>
                ) : metas.length > 0 ? (
                  metas.map((meta) => {
                    const objetivo = Number(meta.valorAlvo) || 0;
                    const atual = Number(meta.valorAtual) || 0;
                    const progresso = objetivo > 0 ? Math.min(100, (atual / objetivo) * 100) : 0;

                    const hoje = new Date();
                    const dataMetaDate = meta.dataMeta ? new Date(meta.dataMeta + "T00:00:00") : null;
                    const hojeSoData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                    const metaAlcancada = progresso >= 100;
                    const metaAtrasada = !metaAlcancada && dataMetaDate && dataMetaDate < hojeSoData;

                    let statusLabel = "";
                    let statusClass = "meta-status";
                    if (metaAlcancada) {
                      statusLabel = "Meta alcançada!";
                      statusClass += " concluida";
                    } else if (metaAtrasada) {
                      statusLabel = "Atrasada";
                      statusClass += " atrasada";
                    } else {
                      statusLabel = "Em progresso";
                      statusClass += " em-progresso";
                    }

                    return (
                      <div key={meta.id} className="mf-item">
                        <div className="mf-info">
                          <h3>{meta.titulo}</h3>
                          <p className="mf-data">
                            Data da meta: {meta.dataMeta ? new Date(meta.dataMeta + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                          </p>
                          {meta.descricao && <p className="mf-descricao">{meta.descricao}</p>}
                          <p className="mf-valores">
                            R$ {atual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de R$ {objetivo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <div className="meta-progress">
                            <div className="meta-progress-bar" style={{ width: `${progresso}%` }} />
                          </div>
                          <p className={statusClass}>{statusLabel}</p>
                        </div>
                        <div className="mf-acoes">
                          <div className="mf-aporte-remover">
                            <input
                              type="number"
                              placeholder="Valor do aporte"
                              className="mf-input-aporte"
                              value={valorAporte}
                              onChange={(e) => setValorAporte(e.target.value)}
                              min="0"
                              step="0.01"
                            />
                            <div className="mf-botoes-aporte">
                              <button className="mf-btn-aporte" onClick={() => handleAportar(meta.id)}>Aportar</button>
                              <button className="mf-btn-tirar" onClick={() => handleTirarAporte(meta.id)}>Tirar aporte</button>
                              <button className="mf-btn-remover" onClick={() => handleRemoverMeta(meta.id)} title="Remover meta">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="mf-lista-vazia"><p>Nenhuma meta cadastrada</p></div>
                )}
              </div>
            </section>
          </div>

          {modalAberto && (
            <div className="modal-overlay" onClick={() => setModalAberto(false)}>
              <div className="modal-conteudo" onClick={e => e.stopPropagation()}>
                <button className="modal-fechar" onClick={() => setModalAberto(false)}><X size={24} /></button>
                <h2>Nova Meta Financeira</h2>
                <form className="mf-form" onSubmit={handleAdicionarMeta}>
                  <div className="form-group">
                    <label htmlFor="titulo">Nome da Meta</label>
                    <input type="text" id="titulo" name="titulo" placeholder="Ex: Carro, PC gamer, Casa..." autocomplete="off" value={novaMeta.titulo} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="valorAlvo">Valor objetivo (R$)</label>
                    <input type="number" id="valorAlvo" name="valorAlvo" placeholder="0.00" step="0.01" min="0" autocomplete="off" value={novaMeta.valorAlvo} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="dataMeta">Data para bater a meta</label>
                    <input type="date" id="dataMeta" name="dataMeta" autocomplete="off" value={novaMeta.dataMeta} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="descricao">Descrição (opcional)</label>
                    <input type="text" id="descricao" name="descricao" placeholder="Ex: Meu primeiro carro, upgrade de celular..." autocomplete="off" value={novaMeta.descricao} onChange={handleInputChange} />
                  </div>
                  <button type="submit" className="btn-salvar">Salvar Meta</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MetasFinanceiras;