import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { translateText } from "./translationClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// idioma base e namespace
const baseLang = "pt";      // <<< pasta base é "pt"
const ns = "common";

// targetLang vem da linha de comando: node i18n-tools/autotranslator.js en
const targetLang = process.argv[2];

if (!targetLang) {
  console.error("Uso: node i18n-tools/autotranslator.js en");
  process.exit(1);
}

// caminhos dos arquivos
const baseFile = path.join(__dirname, "..", "locales", baseLang, `${ns}.json`);
const targetDir = path.join(__dirname, "..", "locales", targetLang);
const targetFile = path.join(targetDir, `${ns}.json`);

if (!fs.existsSync(baseFile)) {
  console.error(`Arquivo base não encontrado: ${baseFile}`);
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const base = JSON.parse(fs.readFileSync(baseFile, "utf8"));

async function translateObject(obj, lang) {
  const result = {};

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (typeof value === "string") {
      result[key] = await translateText(value, lang);
    } else if (typeof value === "object" && value !== null) {
      result[key] = await translateObject(value, lang);
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function run() {
  console.log(
    `🔁 Gerando traduções de ${baseLang} -> ${targetLang} para namespace "${ns}"...`
  );

  const translated = await translateObject(base, targetLang);

  fs.writeFileSync(targetFile, JSON.stringify(translated, null, 2), "utf8");

  console.log(`✅ Tradução salva em: ${targetFile}`);
}

run();