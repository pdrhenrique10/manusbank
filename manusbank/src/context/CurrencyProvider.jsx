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

  // taxas: 1 BRL -> X moeda
  const [rates, setRates] = useState({
    BRL: 1,
    USD: 0.18,
    EUR: 0.17,
    GBP: 0.14,
  });
  const [loadingRates, setLoadingRates] = useState(true);
  const [errorRates, setErrorRates] = useState(null);

  useEffect(() => {
    const API_KEY = import.meta.env.VITE_EXCHANGERATES_API_KEY;
    if (!API_KEY) {
      console.warn("VITE_EXCHANGERATES_API_KEY não configurada");
      setLoadingRates(false);
      return;
    }

    let isCancelled = false;
    let intervalId;

    async function fetchRates() {
      try {
        if (isCancelled) return;

        setLoadingRates(true);
        setErrorRates(null);

        // 1 BRL -> outras moedas
        const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/BRL`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Falha ao buscar taxas de câmbio");
        }

        const data = await res.json();
        if (data.result !== "success") {
          throw new Error("Erro na resposta da API de câmbio");
        }
        if (isCancelled) return;

        setRates((prev) => ({
          BRL: data.conversion_rates.BRL ?? prev.BRL,
          USD: data.conversion_rates.USD ?? prev.USD,
          EUR: data.conversion_rates.EUR ?? prev.EUR,
          GBP: data.conversion_rates.GBP ?? prev.GBP,
        }));
      } catch (error) {
        if (isCancelled) return;
        console.error("Erro ao buscar cotação da moeda:", error);
        setErrorRates(error.message);
      } finally {
        if (!isCancelled) {
          setLoadingRates(false);
        }
      }
    }

    fetchRates();
    intervalId = setInterval(fetchRates, 10 * 60 * 1000);

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(CURRENCY_KEY, currency);
  }, [currency]);

  // BRL -> moeda atual (somente exibição)
  const convertFromBRLToCurrent = (value) => {
    if (value === null || value === undefined) return 0;
    const raw = Number(value) || 0;
    const rate = rates[currency] || 1;
    return raw * rate;
  };

  const formatFromBRL = (value) => {
    if (value === null || value === undefined) return "R$ 0,00";

    const converted = convertFromBRLToCurrent(value);
    const symbol = CURRENCY_SYMBOLS[currency] || "R$";

    const formattedNumber = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);

    return `${symbol} ${formattedNumber}`;
  };

  // valor já na moeda atual (sem conversão)
  const formatMoneyDirect = (value) => {
    if (value === null || value === undefined) return "R$ 0,00";

    const symbol = CURRENCY_SYMBOLS[currency] || "R$";

    const formattedNumber = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

    return `${symbol} ${formattedNumber}`;
  };

  const getCurrencySymbol = () => {
    return CURRENCY_SYMBOLS[currency] || "R$";
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatFromBRL,
        formatMoneyDirect,
        convertFromBRLToCurrent,
        getCurrencySymbol,
        CURRENCY_SYMBOLS,
        rates,
        loadingRates,
        errorRates,
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