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
import Planos from "./pages/Planos/Planos";
import TrocarPlano from "./pages/TrocarPlano/TrocarPlano";
import Layout from "./components/Layout/Layout";
import { ThemeProvider } from "./hooks/useTheme";
import { CurrencyProvider } from "./context/CurrencyProvider";

export default function App() {
  return (
    <BrowserRouter>
      {/* 👇 CurrencyProvider precisa ficar DENTRO do BrowserRouter —
          ele usa useLocation() pra resincronizar a moeda a cada troca
          de rota (ex: login/logout), não só uma vez no carregamento. */}
      <CurrencyProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/planos" element={<Planos />} />

            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/receitas" element={<Receitas />} />
              <Route path="/despesas" element={<Despesas />} />
              <Route path="/contas-a-receber" element={<ContasReceber />} />
              <Route path="/contas-a-pagar" element={<ContasPagar />} />
              <Route path="/metasfinanceiras" element={<MetasFinanceiras />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/trocar-plano" element={<TrocarPlano />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </CurrencyProvider>
    </BrowserRouter>
  );
}