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
import { API_URL } from "../../config/api";

const SIDEBAR_KEY = "sidebarCollapsed";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY);
      return saved === "true";
    } catch {
      return false;
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(isCollapsed));
    } catch {
      // ignora erro de storage
    }
  }, [isCollapsed]);

  function handleToggleSidebar() {
    setIsCollapsed((prev) => !prev);
  }

  async function handleLogout() {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        await fetch(`${API_URL}/api/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (e) {
      console.error("Erro ao deslogar:", e);
    }

    // limpa dados de autenticação no frontend
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  }

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebarTop">
        <button className="menuButton" onClick={handleToggleSidebar}>
          {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>

        <div className="logo">
          <img src="/mflogo.jpeg" alt="Logo ManusFinance" className="logo-image" />
          <h2>ManusFinance</h2>
        </div>
      </div>

      <nav className="sidebarMenu">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
          <LayoutDashboard size={19} />
          <span>Página inicial</span>
        </NavLink>

        <NavLink to="/receitas" className={({ isActive }) => (isActive ? "active" : "")}>
          <TrendingUp size={19} />
          <span>Rendas Fixas</span>
        </NavLink>

        <NavLink to="/despesas" className={({ isActive }) => (isActive ? "active" : "")}>
          <TrendingDown size={19} />
          <span>Despesas Fixas</span>
        </NavLink>

        <NavLink
          to="/contas-a-receber"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <WalletCards size={19} />
          <span>Ganhos não fixos</span>
        </NavLink>

        <NavLink
          to="/contas-a-pagar"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <WalletCards size={19} />
          <span>Gastos não fixos</span>
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
      </nav>
    </aside>
  );
}