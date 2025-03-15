import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import IT_Components from "./locales/it/components.json";
import EN_Components from "./locales/en/components.json";

import IT_InitCms from "./locales/it/init-cms.json";
import EN_InitCms from "./locales/en/init-cms.json";

import IT_Login from "./locales/it/login.json";
import EN_Login from "./locales/en/login.json";

import IT_Profile from "./locales/it/profile.json";
import EN_Profile from "./locales/en/profile.json";

import IT_Users from "./locales/it/users.json";
import EN_Users from "./locales/en/users.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: {
        "init-cms": IT_InitCms,
        login: IT_Login,
        components: IT_Components,
        profile: IT_Profile,
        users: IT_Users,
      },
      en: {
        "init-cms": EN_InitCms,
        login: EN_Login,
        components: EN_Components,
        profile: EN_Profile,
        users: EN_Users,
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
