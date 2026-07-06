// src/i18n/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    // idioma padrão da aplicação
    fallbackLng: "pt",

    // línguas que o app suporta (casam com as pastas em /locales)
    supportedLngs: ["pt", "en", "es", "fr"],

    // namespaces (arquivos) – aqui estamos usando só "common.json"
    ns: ["common"],
    defaultNS: "common",

    interpolation: {
      escapeValue: false,
    },

    backend: {
      // carrega do seu server.js em http://localhost:3000/locales/...
      loadPath: "http://localhost:3000/locales/{{lng}}/{{ns}}.json",
    },
  });

export default i18n;