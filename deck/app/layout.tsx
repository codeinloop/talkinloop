import type { Metadata } from "next";
import "./globals.css";
import { config } from "@/components/config";
import { themeCss } from "@/components/theme";

// Fontes via <link>, não via next/font: o build não depende de rede e, se o Wi-Fi do evento
// falhar, o deck cai para as fontes do sistema sem quebrar. A folha de fontes e os tokens de
// cor vêm do `theme` do deck.config.json (components/theme.ts); sem ele, valem os do globals.css.
const DEFAULT_FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
const fontsUrl = config.theme?.fontsUrl ?? DEFAULT_FONTS;
const theme = themeCss(config.theme);

export const metadata: Metadata = { title: config.title, description: config.description };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={config.lang}>
      <head>
        {/^https:\/\//.test(fontsUrl) && (
          <>
            <link rel="preconnect" href={new URL(fontsUrl).origin} crossOrigin="anonymous" />
            <link rel="stylesheet" href={fontsUrl} />
          </>
        )}
        {theme && <style dangerouslySetInnerHTML={{ __html: theme }} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
