// src/context/CurrencyProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "../config/api";

const CURRENCY_KEY = "currency";
const MOEDAS_VALIDAS = ["BRL", "USD", "EUR", "GBP"];

const CURRENCY_SYMBOLS = {
  BRL: "R$",
  USD: "U$",
  EUR: "€",
  GBP: "£",
};

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const location = useLocation();

  const [currency, setCurrency] = useState(() => {
    try {
      const salvo = localStorage.getItem(CURRENCY_KEY);
      if (MOEDAS_VALIDAS.includes(salvo)) return salvo;
    } catch (e) {}

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (MOEDAS_VALIDAS.includes(parsed.moedaAtual)) {
          return parsed.moedaAtual;
        }
      }
    } catch (e) {}

    return "BRL";
  });

  useEffect(() => {
    localStorage.setItem(CURRENCY_KEY, currency);
  }, [currency]);

  // 👇 Fonte de verdade: sincroniza com o backend a cada troca de rota
  // (não só uma vez no carregamento do app). Isso é essencial porque o
  // CurrencyProvider fica montado o tempo todo — inclusive entre um
  // login e outro — então sem isso, trocar de conta sem dar F5 deixava
  // a moeda "presa" na conta testada anteriormente.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let isCancelled = false;

    async function sincronizarMoeda() {
      try {
        const resp = await fetch(`${API_URL}/api/usuario/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) return;

        const dados = await resp.json();
        if (isCancelled) return;

        if (MOEDAS_VALIDAS.includes(dados.moedaAtual)) {
          setCurrency(dados.moedaAtual);
        }
      } catch (e) {
        console.error("Erro ao sincronizar moeda da conta:", e);
      }
    }

    sincronizarMoeda();

    return () => {
      isCancelled = true;
    };
  }, [location.pathname]);

  const getCurrencySymbol = (moedaEspecifica) => {
    return CURRENCY_SYMBOLS[moedaEspecifica || currency] || "R$";
  };

  const formatValorNaMoeda = (value, moedaDoItem) => {
    if (value === null || value === undefined) return "";

    const symbol = getCurrencySymbol(moedaDoItem);

    const formattedNumber = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

    return `${symbol} ${formattedNumber}`;
  };

  const formatMoney = (value) => formatValorNaMoeda(value, currency);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        getCurrencySymbol,
        formatValorNaMoeda,
        formatMoney,
        CURRENCY_SYMBOLS,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency deve ser usado dentro de um CurrencyProvider");
  }
  return context;
}