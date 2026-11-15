import fs from "node:fs";
import path from "node:path";
import { pick, type Messages } from "./i18n.ts";

export type Reaction = { id: string; emoji: string; label: string };
export type Config = {
  title: string;
  event: string;
  lang: string;
  timeZone: string | undefined;
  publicUrl: string;
  sourceUrl: string;
  reactions: Reaction[];
  theme: string;
  t: Messages;
};

const DEFAULT_REACTIONS: Reaction[] = [{ id: "clap", emoji: "👏", label: "👏" }, { id: "heart", emoji: "❤️", label: "❤️" }];

export const httpUrl = (u: unknown): string => (typeof u === "string" && /^https?:\/\/[^\s]+$/i.test(u) ? u.replace(/\/+$/, "") : "");

// Tokens de tema → variáveis CSS. É a mesma regra de ../deck/components/theme.ts (lá ela vale para
// os slides): se mudar a lista de tokens ou a validação num lugar, mude no outro. As páginas do
// backstage são sempre escuras, então valem os tokens de `dark`, e só as cores: a página da
// plateia usa as fontes do sistema, para abrir rápido no celular.
const TOKENS = ["bg", "bgGlow", "surface", "fg", "muted", "line", "accent", "accentInk", "accentSoft", "shine", "warn", "ok", "codeBg", "codeFg"];
const isColor = (v: unknown): v is string => typeof v === "string" && /^[#(),.%\w\s-]{1,80}$/.test(v);
const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function themeCss(theme: unknown): string {
  const tokens = isRecord(theme) ? theme.dark : null;
  if (!isRecord(tokens)) return "";
  const decl = TOKENS.filter((k) => isColor(tokens[k])).map((k) => `--${kebab(k)}:${tokens[k]}`);
  return decl.length ? `:root:root{${decl.join(";")}}` : "";
}

function validTimeZone(tz: unknown): string | undefined {
  if (typeof tz !== "string" || !tz) return undefined;
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return tz; } catch { return undefined; }
}

export const configFile = (): string =>
  path.resolve(process.env.DECK_CONFIG || path.join(import.meta.dirname, "..", "deck", "talks", process.env.TALK || "starter", "deck.config.json"));

export function loadConfig(file = configFile()): Config {
  let raw: Record<string, unknown> = {};
  let failure = "";
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
    if (isRecord(parsed)) raw = parsed;
  } catch (e) { failure = e instanceof Error ? e.message : String(e); }

  const lang = typeof raw.lang === "string" && /^[a-zA-Z-]{2,12}$/.test(raw.lang) ? raw.lang : "pt-BR";
  const t = pick(lang);
  if (failure) console.warn(`${t.banner.configUnreadable} ${file} (${failure})`);

  const reactions: Reaction[] = (Array.isArray(raw.reactions) ? raw.reactions : [])
    .filter((r): r is Record<string, unknown> => isRecord(r) && typeof r.id === "string" && /^[a-z0-9_-]{1,24}$/.test(r.id) && typeof r.emoji === "string" && r.emoji !== "")
    .map((r) => ({ id: String(r.id), emoji: String(r.emoji), label: String(r.label || r.id) }))
    .slice(0, 6);

  return {
    title: String(raw.title || "Apresentação"),
    event: String(raw.event || ""),
    lang,
    timeZone: validTimeZone(raw.timeZone),
    publicUrl: httpUrl(raw.publicUrl),
    sourceUrl: httpUrl(raw.sourceUrl),
    reactions: reactions.length ? reactions : DEFAULT_REACTIONS,
    theme: themeCss(raw.theme),
    t,
  };
}
