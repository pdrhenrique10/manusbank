import axios from 'axios';

// Substitua pela URL da sua API de tradução
const API_URL = 'https://libretranslate.de/translate';

const cache = new Map();

export async function translateText(text, targetLang) {
  if (!text || targetLang === 'pt') return text;
  const key = `${text}_${targetLang}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await axios.post(API_URL, {
      q: text,
      source: 'pt',
      target: targetLang,
      format: 'text',
    });
    const translated = res.data.translatedText;
    cache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
}