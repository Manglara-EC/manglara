import i18n from "i18next";
import { useTranslation, initReactI18next } from "react-i18next";

import enAdmin from "./locale/en/admin.json";
import esAdmin from "./locale/es/admin.json";
import enAuth from "./locale/en/auth.json";
import esAuth from "./locale/es/auth.json";
import esCommon from "./locale/es/common.json";
import enCommon from "./locale/en/common.json";
import enOrganization from "./locale/en/organizations.json";
import esOrganization from "./locale/es/organizations.json";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      admin: enAdmin,
      auth: enAuth,
      common: enCommon,
      organization: enOrganization,
    },
    es: {
      admin: esAdmin,
      auth: esAuth,
      common: esCommon,
      organization: esOrganization,
    },
  },
  lng: "es",
  fallbackLng: "en",
  ns: ["admin", "auth", "common", "organization"],
  defaultNS: "common",
});

export default i18n;
