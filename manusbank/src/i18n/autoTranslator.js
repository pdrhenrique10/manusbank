const textosOriginais = new WeakMap();
const cache = new Map();

async function translateText(text, targetLang) {
  if (!text || targetLang === 'pt-BR') return text;

  const key = `${text}_${targetLang}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'pt',
        target: targetLang.split('-')[0],
        format: 'text',
      }),
    });

    const data = await res.json();
    const translated = data.translatedText || text;
    cache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
}

const IGNORE_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'SELECT']);

export async function translateDOM(targetLang) {
  console.log('[translateDOM] Iniciando para idioma:', targetLang);

  // Se for português, restaura os textos originais
  if (targetLang === 'pt-BR') {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          if (IGNORE_TAGS.has(node.parentNode.tagName)) return NodeFilter.FILTER_REJECT;
          if (!textosOriginais.has(node)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const nodesParaRestaurar = [];
    while (walker.nextNode()) {
      nodesParaRestaurar.push(walker.currentNode);
    }

    for (const node of nodesParaRestaurar) {
      node.textContent = textosOriginais.get(node);
    }
    return;
  }

  // Salva originais e traduz
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        if (IGNORE_TAGS.has(node.parentNode.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  for (const node of nodes) {
    const original = node.textContent.trim();
    if (original) {
      // Salva o texto original apenas se ainda não estiver salvo
      if (!textosOriginais.has(node)) {
        textosOriginais.set(node, original);
      }
      
      const translated = await translateText(original, targetLang);
      if (translated !== original) {
        node.textContent = translated;
      }
    }
  }
}