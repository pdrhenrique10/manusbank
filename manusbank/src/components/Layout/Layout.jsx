// src/components/Layout/Layout.jsx
import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";

export default function Layout() {
  const token = localStorage.getItem("token");
  const [sidebarAberta, setSidebarAberta] = useState(false);

  if (!token) return <Navigate to="/login" replace />;

  const toggleSidebar = () => setSidebarAberta((prev) => !prev);
  const fecharSidebar = () => setSidebarAberta(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Navbar: topo, largura total */}
      <Navbar onToggleSidebar={toggleSidebar} />

      {/* Abaixo: sidebar + conteúdo da página lado a lado */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Overlay escuro no mobile quando a sidebar está aberta */}
        {sidebarAberta && (
          <div className="sidebar-overlay" onClick={fecharSidebar} />
        )}

        <Sidebar aberta={sidebarAberta} onFechar={fecharSidebar} />

        <div style={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}