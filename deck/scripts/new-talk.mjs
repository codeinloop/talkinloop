import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const name = process.argv[2];

if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
  console.error("uso: npm run new -- <nome>   (letras minúsculas, números e hífen; ex.: minha-palestra)");
  process.exit(1);
}
const dest = path.join(root, "talks", name);
if (fs.existsSync(dest)) { console.error(`talks/${name} já existe`); process.exit(1); }

fs.cpSync(path.join(root, "talks", "starter"), dest, { recursive: true });
console.log(`criada: deck/talks/${name}

  deck.config.json   título, autor, reações e tema (cores e fontes)
  slides/index.tsx   os slides
  ROTEIRO.md         a fala de cada slide
  public/            imagens e vídeos

para escrever com recarga automática:   TALK=${name} npm run dev
para subir com a plateia (da raiz):     TALK=${name} docker compose up --build`);
