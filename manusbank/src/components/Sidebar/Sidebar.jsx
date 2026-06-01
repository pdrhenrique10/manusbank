import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  WalletCards,
  Target,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  Settings
} from "lucide-react";

const SIDEBAR_KEY = "sidebarCollapsed";

export default function Sidebar() {
  // Lê o valor inicial do localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY);
      return saved === "true";
    } catch {
      return false;
    }
  });

  const navigate = useNavigate();

  // Toda vez que mudar, salva no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(isCollapsed));
    } catch {
      // se der erro (modo privado, etc.), só ignora
    }
  }, [isCollapsed]);

  function handleToggleSidebar() {
    setIsCollapsed((prev) => !prev);
  }

  async function handleLogout() {
    try {
      await fetch("http://localhost:3000/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Erro ao deslogar:", e);
    }

    navigate("/login");
  }

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebarTop">
        <button className="menuButton" onClick={handleToggleSidebar}>
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="logo">
          <h2>ManusBank</h2>
        </div>
      </div>

      <nav className="sidebarMenu">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/receitas" className={({ isActive }) => (isActive ? "active" : "")}>
          <TrendingUp size={19} />
          <span>Receitas</span>
        </NavLink>

        <NavLink to="/despesas" className={({ isActive }) => (isActive ? "active" : "")}>
          <TrendingDown size={19} />
          <span>Despesas</span>
        </NavLink>

        <NavLink
          to="/contas-a-receber"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <WalletCards size={19} />
          <span>Contas a Receber</span>
        </NavLink>

        <NavLink
          to="/contas-a-pagar"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <WalletCards size={19} />
          <span>Contas a Pagar</span>
        </NavLink>

        <NavLink
          to="/metasfinanceiras"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <Target size={19} />
          <span>Metas Financeiras</span>
        </NavLink>

        <NavLink
          to="/relatorios"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <BarChart3 size={19} />
          <span>Relatórios</span>
        </NavLink>

        <NavLink
          to="/configuracoes"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <Settings size={19} />
          <span>Configurações</span>
        </NavLink>

        {/* se quiser usar o botão sair visível na sidebar */}
        {/* <button className="sidebar-logout-btn" onClick={handleLogout}>
          Sair
        </button> */}
      </nav>
    </aside>
  );
}