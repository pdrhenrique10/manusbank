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

export default function Sidebar() {
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
    <aside className="sidebar">
      <nav className="sidebarMenu">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
          <LayoutDashboard size={19} />
          <span>{t("sidebar.dashboard")}</span>
        </NavLink>

        <NavLink to="/receitas" className={({ isActive }) => (isActive ? "active" : "")}>
          <TrendingUp size={19} />
          <span>{t("sidebar.fixedIncomes")}</span>
        </NavLink>

        <NavLink to="/despesas" className={({ isActive }) => (isActive ? "active" : "")}>
          <TrendingDown size={19} />
          <span>{t("sidebar.fixedExpenses")}</span>
        </NavLink>

        <NavLink to="/contas-a-receber" className={({ isActive }) => (isActive ? "active" : "")}>
          <WalletCards size={19} />
          <span>{t("sidebar.nonFixedIncomes")}</span>
        </NavLink>

        <NavLink to="/contas-a-pagar" className={({ isActive }) => (isActive ? "active" : "")}>
          <WalletCards size={19} />
          <span>{t("sidebar.nonFixedExpenses")}</span>
        </NavLink>

        <NavLink to="/metasfinanceiras" className={({ isActive }) => (isActive ? "active" : "")}>
          <Target size={19} />
          <span>{t("sidebar.goals")}</span>
        </NavLink>

        <NavLink to="/relatorios" className={({ isActive }) => (isActive ? "active" : "")}>
          <BarChart3 size={19} />
          <span>{t("sidebar.reports")}</span>
        </NavLink>

        <NavLink to="/configuracoes" className={({ isActive }) => (isActive ? "active" : "")}>
          <Settings size={19} />
          <span>{t("sidebar.settings")}</span>
        </NavLink>
      </nav>
    </aside>
  );
}