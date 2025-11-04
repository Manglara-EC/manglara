import i18n from "i18next";
import { useTranslation, initReactI18next } from "react-i18next";
import enAuth from "./locale/en/auth.json";
import esAuth from "./locale/es/auth.json";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      auth: enAuth,
    },
    es: {
      auth: esAuth,
    },
  },
  lng: "es",
  fallbackLng: "en",
  ns: ["auth"],
});

export default i18n;
