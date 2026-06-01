// src/hooks/useTheme.js
import { useEffect, useState } from "react";

const THEME_KEY = "theme";

function aplicarTema(theme) {
  const isDark = theme === "dark";

  // garante que estamos mexendo no <body>
  const body = document.body;

  if (isDark) {
    body.classList.add("dark");
  } else {
    body.classList.remove("dark");
  }

  localStorage.setItem(THEME_KEY, theme);
}

function obterTemaInicial() {
  try {
    const salvo = localStorage.getItem(THEME_KEY);
    if (salvo === "light" || salvo === "dark") return salvo;
  } catch (e) {
    // se der erro no localStorage (ex: modo privado), cai pro padrão
  }

  // se quiser, aqui dá pra ler o tema do sistema:
  // const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  // return prefersDark ? "dark" : "light";

  return "dark"; // padrão
}

export function useTheme() {
  const [theme, setTheme] = useState(obterTemaInicial);

  useEffect(() => {
    aplicarTema(theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  const isDark = theme === "dark";

  return { theme, isDark, toggleTheme };
}