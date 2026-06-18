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

export default function App() {
  // isso já lê o tema salvo e aplica no body assim que o App monta
  const { theme } = useTheme();

  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas sem sidebar */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Páginas com sidebar */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/receitas" element={<Receitas />} />
        <Route path="/despesas" element={<Despesas />} />
        <Route path="/contas-a-receber" element={<ContasReceber />} />
        <Route path="/contas-a-pagar" element={<ContasPagar />} />
        <Route path="/metasfinanceiras" element={<MetasFinanceiras />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </BrowserRouter>
  );
}