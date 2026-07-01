import { createContext, useContext, useState, useCallback } from 'react';
import ptBR from '../i18n/pt-BR.json';
import en from '../i18n/en.json';
import es from '../i18n/es.json';

const idiomas = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
};

const IdiomaContext = createContext();

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(() => {
    return localStorage.getItem('idioma') || 'pt-BR';
  });
  const [traduzindo, setTraduzindo] = useState(false);

  // Função de tradução com interpolação
  const t = useCallback((chave, params = {}) => {
    const traducoes = idiomas[idioma] || idiomas['pt-BR'];
    const chaves = chave.split('.');
    let valor = traducoes;
    for (const k of chaves) {
      if (valor && typeof valor === 'object' && valor[k] !== undefined) {
        valor = valor[k];
      } else {
        return chave;   // fallback: retorna a chave
      }
    }
    if (typeof valor === 'string') {
      return valor.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
    }
    return valor;
  }, [idioma]);

  const mudarIdioma = useCallback((novoIdioma) => {
    if (!idiomas[novoIdioma] || novoIdioma === idioma) return;
    setTraduzindo(true);
    setIdioma(novoIdioma);
    localStorage.setItem('idioma', novoIdioma);
    setTimeout(() => setTraduzindo(false), 200);
  }, [idioma]);

  return (
    <IdiomaContext.Provider value={{ idioma, mudarIdioma, traduzindo, t }}>
      {children}
    </IdiomaContext.Provider>
  );
}

// Hook que já era usado em Configuracoes – mantém o nome
export function useIdioma() {
  const context = useContext(IdiomaContext);
  if (!context) {
    throw new Error('useIdioma deve ser usado dentro de IdiomaProvider');
  }
  return context;
}