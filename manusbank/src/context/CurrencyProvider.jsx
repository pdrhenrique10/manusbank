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

  const getCurrencySymbol = (moedaEspecifica) => {
    return CURRENCY_SYMBOLS[moedaEspecifica || currency] || "R$";
  };

  // ===== FORMATAÇÃO SEM CONVERSÃO =====
  // Formata um valor que JÁ ESTÁ na moeda informada (ou na moeda atual,
  // se não informar). Não faz nenhuma conversão — é isso que praticamente
  // toda tela deve usar pra exibir valores de transações/contas/metas,
  // já que cada item guarda sua própria moeda vinda do backend.
  const formatValorNaMoeda = (value, moedaDoItem) => {
    if (value === null || value === undefined) return "";

    const symbol = getCurrencySymbol(moedaDoItem);

    const formattedNumber = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

    return `${symbol} ${formattedNumber}`;
  };

  // Atalho usado em gráficos/tooltips: formata um valor já assumido como
  // estando na moeda atualmente selecionada (ex: valores computados no
  // próprio front, sem vínculo a um item específico do backend).
  const formatMoney = (value) => formatValorNaMoeda(value, currency);

  // ===== CONVERSÃO ENTRE MOEDAS (só quando REALMENTE precisar somar
  // itens que estão em moedas diferentes — cenário Premium) =====
  const converterEntreMoedas = (value, deMoeda, paraMoeda) => {
    if (value === null || value === undefined) return 0;
    const raw = Number(value) || 0;

    const origem = deMoeda || "BRL";
    const destino = paraMoeda || currency;

    if (origem === destino) return raw;

    const rateOrigem = rates[origem] || 1; // 1 BRL -> origem
    const rateDestino = rates[destino] || 1; // 1 BRL -> destino

    const valorEmBRL = raw / rateOrigem;
    return valorEmBRL * rateDestino;
  };

  // Converte pra moeda atual e já formata com símbolo — útil em somatórios
  // (saldo total, KPIs) quando os itens podem estar em moedas diferentes.
  const formatConvertendoParaAtual = (value, moedaDoItem) => {
    const convertido = converterEntreMoedas(value, moedaDoItem || "BRL", currency);
    return formatMoney(convertido);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        loadingRates,
        errorRates,
        getCurrencySymbol,
        formatValorNaMoeda,
        formatMoney,
        converterEntreMoedas,
        formatConvertendoParaAtual,
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