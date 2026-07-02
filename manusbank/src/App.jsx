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
import { ThemeProvider } from "./hooks/useTheme";
import { CurrencyProvider } from "./context/CurrencyProvider";

export default function App() {
  return (
    <CurrencyProvider>
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route 
            path="/dashboard" 
            element={<CurrencyProvider><Dashboard /></CurrencyProvider>} 
          />
          <Route 
            path="/receitas" 
            element={<CurrencyProvider><Receitas /></CurrencyProvider>} 
          />
          <Route 
            path="/despesas" 
            element={<CurrencyProvider><Despesas /></CurrencyProvider>} 
          />
          <Route 
            path="/contas-a-receber" 
            element={<CurrencyProvider><ContasReceber /></CurrencyProvider>} 
          />
          <Route 
            path="/contas-a-pagar" 
            element={<CurrencyProvider><ContasPagar /></CurrencyProvider>} 
          />
          <Route 
            path="/metasfinanceiras" 
            element={<CurrencyProvider><MetasFinanceiras /></CurrencyProvider>} 
          />
          <Route 
            path="/relatorios" 
            element={<CurrencyProvider><Relatorios /></CurrencyProvider>} 
          />
          <Route 
            path="/configuracoes" 
            element={<CurrencyProvider><Configuracoes /></CurrencyProvider>} 
          />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
    </CurrencyProvider>
  );
}