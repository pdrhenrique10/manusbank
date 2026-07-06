import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const IdiomaContext = createContext();

const MAPA_IDIOMA_PASTA = {
  "pt-BR": "pt",
  en: "en",
  es: "es",
  fr: "fr",
};

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(() => {
    return localStorage.getItem("idioma") || "pt-BR";
  });
  const [traduzindo, setTraduzindo] = useState(false);
  const [traducoes, setTraducoes] = useState(null);

  useEffect(() => {
    const pasta = MAPA_IDIOMA_PASTA[idioma] || "pt";
    const path = `/locales/${pasta}/common.json`;

    setTraduzindo(true);
    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ao carregar ${path}`);
        return res.json();
      })
      .then((data) => {
        setTraducoes(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar traduções:", err);
      })
      .finally(() => setTraduzindo(false));
  }, [idioma]);

  const t = useCallback(
    (chave, params = {}) => {
      if (!traducoes) return chave;

      const chaves = chave.split(".");
      let valor = traducoes;

      for (const k of chaves) {
        if (valor && typeof valor === "object" && valor[k] !== undefined) {
          valor = valor[k];
        } else {
          return chave;
        }
      }

      if (typeof valor === "string") {
        return valor.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
      }

      return valor;
    },
    [traducoes]
  );

  const mudarIdioma = useCallback(
    (novoIdioma) => {
      if (!MAPA_IDIOMA_PASTA[novoIdioma] || novoIdioma === idioma) return;
      setIdioma(novoIdioma);
      localStorage.setItem("idioma", novoIdioma);
    },
    [idioma]
  );

  return (
    <IdiomaContext.Provider value={{ idioma, mudarIdioma, traduzindo, t }}>
      {children}
    </IdiomaContext.Provider>
  );
}

export function useIdioma() {
  const context = useContext(IdiomaContext);
  if (!context) {
    throw new Error("useIdioma deve ser usado dentro de IdiomaProvider");
  }
  return context;
}