import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar"; // Ajuste o caminho da sua Sidebar

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`mainLayout ${isCollapsed ? 'collapsed' : ''}`}>
      {/* A Sidebar fica fixa aqui para todas as páginas do Layout */}
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      {/* O Outlet é onde o React-Router vai renderizar a página atual (Dashboard, Receitas, etc.) */}
      <main className="dashboard">
        <Outlet />
      </main>
    </div>
  );
}