// src/components/Sidebar/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  WalletCards,
  Target,
  BarChart3,
  Settings
} from "lucide-react";
import { API_URL } from "../../config/api";
import { useIdioma } from "../../context/IdiomaContext";

export default function Sidebar({ aberta, onFechar }) {
  const navigate = useNavigate();
  const { t } = useIdioma();

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

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <aside className={`sidebar ${aberta ? "sidebar-aberta" : ""}`}>
      <nav className="sidebarMenu">
        <NavLink to="/dashboard" onClick={onFechar} className={({ isActive }) => (isActive ? "active" : "")}>
          <LayoutDashboard size={19} />
          <span>{t("sidebar.dashboard")}</span>
        </NavLink>

        <NavLink to="/receitas" onClick={onFechar} className={({ isActive }) => (isActive ? "active" : "")}>
          <TrendingUp size={19} />
          <span>{t("sidebar.fixedIncomes")}</span>
        </NavLink>

        <NavLink to="/despesas" onClick={onFechar} className={({ isActive }) => (isActive ? "active" : "")}>
          <TrendingDown size={19} />
          <span>{t("sidebar.fixedExpenses")}</span>
        </NavLink>

        <NavLink to="/contas-a-receber" onClick={onFechar} className={({ isActive }) => (isActive ? "active" : "")}>
          <WalletCards size={19} />
          <span>{t("sidebar.nonFixedIncomes")}</span>
        </NavLink>

        <NavLink to="/contas-a-pagar" onClick={onFechar} className={({ isActive }) => (isActive ? "active" : "")}>
          <WalletCards size={19} />
          <span>{t("sidebar.nonFixedExpenses")}</span>
        </NavLink>

        <NavLink to="/metasfinanceiras" onClick={onFechar} className={({ isActive }) => (isActive ? "active" : "")}>
          <Target size={19} />
          <span>{t("sidebar.goals")}</span>
        </NavLink>

        <NavLink to="/relatorios" onClick={onFechar} className={({ isActive }) => (isActive ? "active" : "")}>
          <BarChart3 size={19} />
          <span>{t("sidebar.reports")}</span>
        </NavLink>

        <NavLink to="/configuracoes" onClick={onFechar} className={({ isActive }) => (isActive ? "active" : "")}>
          <Settings size={19} />
          <span>{t("sidebar.settings")}</span>
        </NavLink>
      </nav>
    </aside>
  );
}