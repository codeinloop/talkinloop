import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "out");
const BASE = "/apresentador";

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const tema = arg("tema");
const saida = path.resolve(arg("saida") ?? path.join(root, "slides.pdf"));
const png = process.argv.includes("--png");
const pngDir = path.join(root, "slides-png");

if (!fs.existsSync(path.join(out, "pdf", "index.html"))) {
  console.error("não achei out/pdf/index.html: rode `npm run build` antes (o `npm run pdf` já faz isso)");
  process.exit(1);
}

const candidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
].filter(Boolean);
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  console.error("não achei Chrome nem Edge; aponte CHROME_PATH para o executável");
  process.exit(1);
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".mp4": "video/mp4", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (!rel.startsWith(BASE + "/")) { res.writeHead(404); return res.end(); }
  rel = rel.slice(BASE.length);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(out, rel);
  if (!file.startsWith(out) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

const chrome = (profile, args) => new Promise((resolve) => {
  spawn(browser, ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${profile}`, ...args], { stdio: "ignore" }).on("exit", resolve);
});

server.listen(0, "127.0.0.1", async () => {
  const query = tema === "claro" ? "tema=claro" : "";
  const page = `http://127.0.0.1:${server.address().port}${BASE}/pdf/`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "deck-pdf-"));
  const hasQr = fs.readFileSync(path.join(out, "pdf", "index.html"), "utf8").includes("qr-code");
  if (png) {
    let total = 0; // out/1, out/2... (out/404 não conta)
    while (fs.existsSync(path.join(out, String(total + 1), "index.html"))) total++;
    fs.rmSync(pngDir, { recursive: true, force: true });
    fs.mkdirSync(pngDir, { recursive: true });
    for (let n = 1; n <= total; n++) {
      const file = path.join(pngDir, String(n).padStart(2, "0") + ".png");
      await chrome(profile, ["--window-size=1600,900", "--hide-scrollbars", "--virtual-time-budget=8000", `--screenshot=${file}`, `${page}?folha=${n}${query && "&" + query}`]);
      if (!fs.existsSync(file)) { console.error(`o navegador não gerou a imagem do slide ${n}`); process.exit(1); }
    }
    console.log(`${total} imagens em ${pngDir}`);
  } else {
    fs.rmSync(saida, { force: true });
    // --virtual-time-budget: espera fontes e a montagem da página
    const code = await chrome(profile, ["--no-pdf-header-footer", "--virtual-time-budget=15000", `--print-to-pdf=${saida}`, page + (query && "?" + query)]);
    if (!fs.existsSync(saida)) { console.error(`o navegador saiu (código ${code}) sem gerar o PDF`); process.exit(1); }
    console.log(`PDF gerado: ${saida} (${(fs.statSync(saida).size / 1024 / 1024).toFixed(1)} MB)`);
  }
  if (!hasQr) {
    console.log([
      "  sem QR: o endereço da plateia só existe com o backstage no ar. Para sair com QR (e para",
      "  conferir se algum slide passa por baixo dele), defina publicUrl no deck.config.json ou rode",
      "  com NEXT_PUBLIC_QR_URL=https://seu-endereco.",
    ].join("\n"));
  }
  server.close();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
});
