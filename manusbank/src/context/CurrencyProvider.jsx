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
    return "BRL"; // Padrão brasileiro
  });

  // 🔥 ESTADO DAS COTAÇÕES (Atualizado com valores de fallback mais realistas)
  const [rates, setRates] = useState({
    BRL: 1,
    USD: 5.18,
    EUR: 5.60,
    GBP: 6.40
  });

  // Buscar cotações na AwesomeAPI
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
        // Se falhar, mantém os valores de fallback
      }
    }

    fetchRates();
  }, []);

  // Salvar a preferência da moeda no localStorage
  useEffect(() => {
    localStorage.setItem(CURRENCY_KEY, currency);
  }, [currency]);

  // 🔥 FORMATADOR UNIVERSAL (Corrigido para Euro e Libra)
  const formatMoney = (value) => {
    if (value === null || value === undefined) return "R$ 0,00";

    const symbol = CURRENCY_SYMBOLS[currency] || "R$";
    const rate = rates[currency] || 1;
    
    // 1. Converte o valor (divide pela cotação)
    const convertedValue = value / rate;

    // 2. Formata o número usando a localização pt-BR (vírgula para decimais, ponto para milhar)
    // Mas sem definir 'style: currency' ou 'currency', para não forçar símbolos.
    const formattedNumber = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedValue);

    // 3. Retorna o símbolo na frente do número (com um espaço opcional)
    return `${symbol} ${formattedNumber}`;
  };

  // 🔥 FUNÇÃO PARA CONVERSÃO (Gráficos e cálculos)
  const convertValue = (value) => {
    const rate = rates[currency] || 1;
    return value / rate;
  };

  // 🔥 FUNÇÃO PARA CONVERTER DE VOLTA PARA REAL (Salvar no banco)
  const convertToBRL = (value) => {
    if (currency === "BRL") return value;
    const rate = rates[currency] || 1;
    return value * rate;
  };

  // 🔥 Retorna apenas o símbolo
  const getCurrencySymbol = () => {
    return CURRENCY_SYMBOLS[currency] || "R$";
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      formatMoney, 
      convertValue,
      convertToBRL,
      getCurrencySymbol,
      CURRENCY_SYMBOLS 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Hook para usar dentro dos componentes
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency deve ser usado dentro de um CurrencyProvider");
  }
  return context;
}