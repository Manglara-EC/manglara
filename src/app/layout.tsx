import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { cookies } from "next/headers";

import { Providers } from "@/shared/components/providers";
import { LanguageProvider, useLanguage } from "@/app/context/language-context";
import "@/shared/styles/globals.css";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLang = cookieStore.get("lang")?.value || "es";

  return (
    <html
      lang={initialLang}
      suppressHydrationWarning
      className={GeistSans.className}
    >
      <body>
        <LanguageProvider>
          <Providers>{children}</Providers>
          <Analytics />
          <SpeedInsights />
        </LanguageProvider>
      </body>
    </html>
  );
}
