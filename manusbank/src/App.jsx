import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Receitas from "./pages/Receitas/Receitas";
import Despesas from "./pages/Despesas/Despesas";
import ContasReceber from "./pages/ContasReceber/ContasReceber";
import ContasPagar from "./pages/ContasPagar/ContasPagar";
import MetasFinanceiras from "./pages/MetasFinanceiras/MetasFinanceiras";
import Relatorios from "./pages/Relatorios/Relatorios";
import Configuracoes from "./pages/Configuracoes/Configuracoes";
import { useTheme } from "./hooks/useTheme";

// IMPORTE O SEU LAYOUT AQUI
import MobileLayout from "./components/MobileLayout"; 

export default function App() {
  const { theme } = useTheme();

  return (
    <BrowserRouter>
      <Routes>
        
        {/* 1. Páginas SEM Sidebar/Navbar (Ficam soltas) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 2. Páginas COM Sidebar/Navbar (Envolvidas pelo MobileLayout) */}
        {/* O segredo é colocar a rota pai assim: */}
        <Route element={<MobileLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/receitas" element={<Receitas />} />
          <Route path="/despesas" element={<Despesas />} />
          <Route path="/contas-a-receber" element={<ContasReceber />} />
          <Route path="/contas-a-pagar" element={<ContasPagar />} />
          <Route path="/metasfinanceiras" element={<MetasFinanceiras />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}