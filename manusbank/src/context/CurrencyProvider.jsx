// src/context/CurrencyProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const CURRENCY_KEY = "currency";

const CURRENCY_SYMBOLS = {
  BRL: "R$",
  USD: "U$",
  EUR: "€",
  GBP: "£",
};

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    try {
      const salvo = localStorage.getItem(CURRENCY_KEY);
      if (["BRL", "USD", "EUR", "GBP"].includes(salvo)) return salvo;
    } catch (e) {}
    return "BRL";
  });

  useEffect(() => {
    localStorage.setItem(CURRENCY_KEY, currency);
  }, [currency]);

  const getCurrencySymbol = (moedaEspecifica) => {
    return CURRENCY_SYMBOLS[moedaEspecifica || currency] || "R$";
  };

  // Formata um valor que já está na moeda informada (ou na moeda atual
  // da conta, se não informar). Como a moeda agora é fixa por conta,
  // essa é a ÚNICA função de exibição de valores monetários que o app
  // precisa — nunca há conversão entre moedas diferentes.
  const formatValorNaMoeda = (value, moedaDoItem) => {
    if (value === null || value === undefined) return "";

    const symbol = getCurrencySymbol(moedaDoItem);

    const formattedNumber = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

    return `${symbol} ${formattedNumber}`;
  };

  // Atalho: formata um valor assumido como estando na moeda atual da conta.
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