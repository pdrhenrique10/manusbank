// src/hooks/useTheme.js
import React, { createContext, useContext, useEffect, useState } from "react";

const THEME_KEY = "theme";
const ThemeContext = createContext();

// Função para verificar se o usuário está logado
function isUserLoggedIn() {
  const token = localStorage.getItem("token");
  return token !== null && token !== "";
}

function aplicarTema(theme) {
  const isDark = theme === "dark";
  const body = document.body;

  if (isDark) {
    body.classList.add("dark");
  } else {
    body.classList.remove("dark");
  }
}

// O Provedor que envolve as rotas
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Se NÃO estiver logado, retorna "dark" e ignora o localStorage
    if (!isUserLoggedIn()) {
      return "dark";
    }

    try {
      const salvo = localStorage.getItem(THEME_KEY);
      if (salvo === "light" || salvo === "dark") return salvo;
    } catch (e) {}
    
    return "dark";
  });

  // Aplica o tema sempre que ele mudar
  useEffect(() => {
    const loggedIn = isUserLoggedIn();

    if (!loggedIn) {
      setTheme("dark");
      aplicarTema("dark");
      return;
    }

    aplicarTema(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    if (!isUserLoggedIn()) {
      console.warn("⚠️ Tema não pode ser alterado fora do sistema.");
      return;
    }
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// O Hook que você usa nos componentes
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  return context;
}