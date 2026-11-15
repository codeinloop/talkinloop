import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRoteiro } from "./roteiro.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const talk = process.env.TALK || "starter";
const dir = path.join(root, "talks", talk);

const available = () => fs.readdirSync(path.join(root, "talks"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).join(", ");
if (!/^[a-z0-9][a-z0-9-]*$/.test(talk) || !fs.existsSync(dir)) {
  console.error(`apresentação "${talk}" não existe em talks/. Disponíveis: ${available()}`);
  process.exit(1);
}
for (const need of ["deck.config.json", path.join("slides", "index.tsx")]) {
  if (!fs.existsSync(path.join(dir, need))) { console.error(`falta talks/${talk}/${need.replace(/\\/g, "/")}`); process.exit(1); }
}

const pub = path.join(root, "public");
fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(pub, { recursive: true });
const src = path.join(dir, "public");
if (fs.existsSync(src)) fs.cpSync(src, pub, { recursive: true });

// Backdrop é opcional: quando a apresentação não exporta, o arquivo gerado exporta `undefined`
// (reexportar um nome que não existe quebraria o build).
const hasBackdrop = /export\s+(?:function|const|class)\s+Backdrop\b|export\s*\{[^}]*\bBackdrop\b/.test(fs.readFileSync(path.join(dir, "slides", "index.tsx"), "utf8"));
fs.writeFileSync(path.join(root, "components", "talk.generated.ts"), `// Gerado por scripts/prepare.mjs (TALK=${talk}). Não edite: mude TALK e rode de novo.
import rawConfig from "../talks/${talk}/deck.config.json";

export { slides } from "../talks/${talk}/slides";
${hasBackdrop ? `export { Backdrop } from "../talks/${talk}/slides";` : "export const Backdrop = undefined;"}
export { rawConfig };
`);

const roteiro = buildRoteiro(path.join(dir, "ROTEIRO.md"), path.join(root, "components", "roteiro.json"));
console.log(`apresentação: talks/${talk} · roteiro: ${roteiro.count} slides`);

const warn = (text) => console.warn(`  aviso: ${text}`);
const source = fs.readFileSync(path.join(dir, "slides", "index.tsx"), "utf8");
const total = (source.match(/^\s*title:\s*["'`]/gm) ?? []).length; // um `title:` por slide
for (const h of roteiro.ignored) warn(`ROTEIRO.md: "${h}" não começa com o número do slide (### 03 · Título) e ficou de fora`);
if (total) for (const n of roteiro.numbers) if (n < 1 || n > total) warn(`ROTEIRO.md: a seção ${String(n).padStart(2, "0")} não tem slide (a apresentação tem ${total})`);
if (talk !== "starter") {
  const script = path.join(dir, "ROTEIRO.md");
  if (fs.existsSync(script) && fs.readFileSync(script, "utf8").includes("Escreva a fala como você falaria")) warn("ROTEIRO.md ainda tem a fala de exemplo da apresentação inicial");
  const config = fs.readFileSync(path.join(dir, "deck.config.json"), "utf8");
  for (const leftover of ["Seu Nome", "seu-site.com", "example.com", "Título da sua apresentação", "Nome do evento"]) {
    if (source.includes(leftover) || config.includes(leftover)) warn(`sobrou "${leftover}" da apresentação inicial`);
  }
}
