import "./sidebar.css";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  WalletCards,
  Target,
  BarChart3,
  Tags,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ isCollapsed, toggleSidebar }) {
  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebarTop">
        <button className="menuButton" onClick={toggleSidebar}>
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="logo">
          {/* Se quiser esconder o texto quando recolhido, faz via CSS usando .collapsed */}
          <h2>ManusBank</h2>
        </div>
      </div>

      <nav className="sidebarMenu">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/receitas"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <TrendingUp size={19} />
          <span>Receitas</span>
        </NavLink>

        <NavLink
          to="/despesas"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
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
      </nav>
    </aside>
  );
}