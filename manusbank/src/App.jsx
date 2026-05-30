import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout"; // Importe o seu novo Layout
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

// Se você tiver as outras páginas criadas, importe-as aqui:
// import Receitas from "./pages/Receitas/Receitas";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PÁGINAS SEM SIDEBAR (Públicas) */}
        {/* CORRIGIDO: Mudado de <path... para <Route... */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PÁGINAS COM SIDEBAR (Colocadas como filhas do Layout) */}
        {/* CORRIGIDO: Fechamento da tag com > em vez de /> */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/receitas" element={<Receitas />} /> 
          <Route path="/despesas" element={<Despesas />} />
          <Route path="/contas-a-receber" element={<ContasReceber />} />
          <Route path="/contas-a-pagar" element={<ContasPagar />} />
          <Route path="/metasfinanceiras" element={<MetasFinanceiras />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}