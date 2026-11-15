import { rawConfig } from "@/components/talk.generated";

export type Reaction = { id: string; emoji: string; label: string };
export type ThemeTokens = Partial<Record<(typeof import("@/components/theme").TOKENS)[number], string>>;
export type Theme = {
  fontsUrl?: string;
  fonts?: { display?: string; body?: string; mono?: string };
  dark?: ThemeTokens;
  light?: ThemeTokens;
};
export type DeckConfig = {
  title: string;
  description: string;
  event: string;
  lang: string;
  timeZone?: string;
  author: { name: string; tagline: string };
  publicUrl: string;
  sourceUrl: string;
  reactions: Reaction[];
  poweredBy?: boolean;
  theme?: Theme;
};

export const config = rawConfig as DeckConfig;

export const EMOJI: Record<string, string> = Object.fromEntries(config.reactions.map((r) => [r.id, r.emoji]));
export const FALLBACK_EMOJI = config.reactions[0]?.emoji ?? "👏";

export const BUILD_PUBLIC_URL = (process.env.NEXT_PUBLIC_QR_URL || config.publicUrl || "").replace(/\/+$/, "");
