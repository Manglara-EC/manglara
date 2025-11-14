"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import i18n from "@/shared/lib/i18n/i18n";

const LanguageContext = createContext<{
  language: string;
  setLanguage: (lang: string) => void;
}>({
  language: "es",
  setLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState("es");

  useEffect(() => {
    const langCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("lang="))
      ?.split("=")[1];

    const initialLang = langCookie || "es";
    setLanguageState(initialLang);
    i18n.changeLanguage(initialLang);
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    document.cookie = `lang=${lang}; path=/; max-age=${60 * 60 * 24 * 30}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
