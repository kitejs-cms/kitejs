import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import IT_InitCms from "./locales/it/init-cms.json";
import EN_InitCms from "./locales/en/init-cms.json";

import IT_Login from "./locales/it/login.json";
import EN_Login from "./locales/en/login.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: {
        "init-cms": IT_InitCms,
        login: IT_Login,
      },
      en: {
        "init-cms": EN_InitCms,
        login: EN_Login,
      },
    },
    fallbackLng: "en",
    detection: {
      order: ["navigator", "localStorage", "cookie"],
      caches: ["localStorage", "cookie"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
