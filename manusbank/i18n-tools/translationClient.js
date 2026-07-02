import axios from "axios";

const API_URL = "https://libretranslate.de/translate";
const cache = new Map();

export async function translateText(text, targetLang) {
  if (!text) return text;

  // base pt -> se destino for pt, não traduz
  if (targetLang === "pt") return text;

  const key = `${text}_${targetLang}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await axios.post(API_URL, {
      q: text,
      source: "pt",
      target: targetLang, // "en", "es", "fr", etc.
      format: "text",
    });

    const translated = res.data.translatedText || text;
    cache.set(key, translated);
    return translated;
  } catch (err) {
    console.error("Erro ao traduzir texto:", err.message);
    return text;
  }
}