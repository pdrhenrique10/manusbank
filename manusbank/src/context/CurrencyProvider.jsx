// src/context/CurrencyProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const CURRENCY_KEY = "currency";

// Lista de moedas disponíveis e seus símbolos
const CURRENCY_SYMBOLS = {
  BRL: "R$",
  USD: "U$",
  EUR: "€",
  GBP: "£"
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

  const [rates, setRates] = useState({
    BRL: 1,
    USD: 5.18,
    EUR: 5.60,
    GBP: 6.40
  });

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL");
        const data = await res.json();

        setRates({
          BRL: 1,
          USD: parseFloat(data.USDBRL.bid),
          EUR: parseFloat(data.EURBRL.bid),
          GBP: parseFloat(data.GBPBRL.bid)
        });
      } catch (error) {
        console.error("Erro ao buscar cotação da moeda:", error);
      }
    }

    fetchRates();
  }, []);

  useEffect(() => {
    localStorage.setItem(CURRENCY_KEY, currency);
  }, [currency]);

  // Formatador COM conversão (para transações normais)
  const formatMoney = (value) => {
    if (value === null || value === undefined) return "R$ 0,00";

    const symbol = CURRENCY_SYMBOLS[currency] || "R$";
    const rate = rates[currency] || 1;
    
    const convertedValue = value / rate;

    const formattedNumber = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedValue);

    return `${symbol} ${formattedNumber}`;
  };

  // 👇 NOVO: Formatador SEM conversão (para metas - valor já está na moeda escolhida)
  const formatMoneyDirect = (value) => {
    if (value === null || value === undefined) return "R$ 0,00";

    const symbol = CURRENCY_SYMBOLS[currency] || "R$";

    const formattedNumber = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

    return `${symbol} ${formattedNumber}`;
  };

  const convertValue = (value) => {
    const rate = rates[currency] || 1;
    return value / rate;
  };

  const convertToBRL = (value) => {
    if (currency === "BRL") return value;
    const rate = rates[currency] || 1;
    return value * rate;
  };

  const getCurrencySymbol = () => {
    return CURRENCY_SYMBOLS[currency] || "R$";
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      formatMoney,
      formatMoneyDirect, // 👈 exporta a nova função
      convertValue,
      convertToBRL,
      getCurrencySymbol,
      CURRENCY_SYMBOLS 
    }}>
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