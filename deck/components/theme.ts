import type { Theme } from "@/components/config";

export const TOKENS = ["bg", "bgGlow", "surface", "fg", "muted", "line", "accent", "accentInk", "accentSoft", "shine", "warn", "ok", "codeBg", "codeFg"] as const;

// só valores de cor simples: nada que feche a regra ou abra outra
const color = (v: unknown): v is string => typeof v === "string" && /^[#(),.%\w\s-]{1,80}$/.test(v);
const font = (v: unknown): v is string => typeof v === "string" && /^[\w -]{1,60}$/.test(v);
const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

function block(selector: string, tokens: Record<string, unknown> | undefined, extra: string[] = []) {
  const decl = [...extra];
  for (const k of TOKENS) if (tokens && color(tokens[k])) decl.push(`--${kebab(k)}:${tokens[k]}`);
  return decl.length ? `${selector}{${decl.join(";")}}` : "";
}

export function themeCss(theme: Theme | undefined): string {
  if (!theme) return "";
  const fonts = (["display", "body", "mono"] as const).filter((k) => font(theme.fonts?.[k])).map((k) => `--font-${k}:"${theme.fonts![k]}"`);
  // :root:root vence o :root do globals.css qualquer que seja a ordem das folhas
  return block(":root:root", theme.dark, fonts) + block(':root:root[data-theme="light"]', theme.light);
}
