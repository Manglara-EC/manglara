import i18n from "i18next";
import { useTranslation, initReactI18next } from "react-i18next";

import enAuth from "./locale/en/auth.json";
import esAuth from "./locale/es/auth.json";
import esCommon from "./locale/es/common.json";
import enCommon from "./locale/en/common.json";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      auth: enAuth,
      common: enCommon,
    },
    es: {
      auth: esAuth,
      common: esCommon,
    },
  },
  lng: "es",
  fallbackLng: "en",
  ns: ["auth", "common"],
  defaultNS: "common",
});

export default i18n;
