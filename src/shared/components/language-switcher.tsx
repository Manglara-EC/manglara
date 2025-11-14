"use client";

import "@/shared/lib/i18n/i18n";
import { useLanguage } from "@/app/context/language-context";
import Image from "next/image";

const languages = [
  { code: "es", label: "ES", flag: "/flags/es.svg" },
  { code: "en", label: "EN", flag: "/flags/en.svg" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLang = language === "es" ? "en" : "es";
    setLanguage(newLang);
  };

  const currentLang = languages.find((l) => l.code === language)!;

  return (
    <button
      onClick={toggleLanguage}
      className="
        group flex items-center gap-2 px-4 py-2 rounded-full
        border border-gray-300 dark:border-gray-700
        bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm
        cursor-pointer
        transition-all duration-300 ease-in-out
        hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600
        hover:bg-gray-100 dark:hover:bg-gray-800
        active:scale-95
      "
    >
      <div
        className="
          w-6 h-6 flex items-center justify-center
          rounded-full bg-transparent
          transform transition-transform duration-300 group-hover:scale-110
        "
      >
        <Image
          src={currentLang.flag}
          alt={currentLang.label}
          width={24}
          height={24}
          className="object-contain"
        />
      </div>

      <span
        className="
          uppercase font-semibold tracking-wide
          text-gray-700 dark:text-gray-200
          transition-colors duration-300
          group-hover:text-black dark:group-hover:text-white
        "
      >
        {currentLang.label}
      </span>
    </button>
  );
}
