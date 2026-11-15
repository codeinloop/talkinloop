import { existsSync, readFileSync, writeFileSync } from "node:fs";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// negrito, código e itálico. Itálico só com _ na borda da palavra: on_behalf_of fica intacto.
function inline(text) {
  const codes = [];
  let s = esc(text).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(“"])_([^_\n]+?)_(?=[\s.,;:!?)”"]|$)/g, "$1<em>$2</em>");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}

function render(lines) {
  const html = [];
  let para = [], list = null, code = null;
  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(" ");
    html.push(/^_Tela:.*_$/.test(text) ? `<p class="tela">${inline(text.slice(1, -1))}</p>` : `<p>${inline(text)}</p>`);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    html.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (code) {
      if (/^```/.test(line)) { html.push(`<pre>${esc(code.join("\n"))}</pre>`); code = null; } else code.push(line);
      continue;
    }
    if (/^```/.test(line)) { flushPara(); flushList(); code = []; continue; }
    if (!line.trim() || /^---+$/.test(line)) { flushPara(); flushList(); continue; }
    const item = line.match(/^\s*(\d+\.|[-*])\s+(.*)$/);
    if (item) {
      flushPara();
      const tag = /\d/.test(item[1]) ? "ol" : "ul";
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push(item[2]);
      continue;
    }
    if (list) { list.items[list.items.length - 1] += " " + line.trim(); continue; }
    para.push(line.trim());
  }
  flushPara(); flushList();
  if (code) html.push(`<pre>${esc(code.join("\n"))}</pre>`);
  return html.join("");
}

export function buildRoteiro(src, out) {
  const lines = existsSync(src) ? readFileSync(src, "utf8").split(/\r?\n/) : [];
  const slides = {};
  const ignored = [];
  let ato = null, atoIntro = [], current = null, body = [];
  const close = () => { if (current) slides[current.n] = { title: current.title, ato: current.ato, intro: current.intro, html: render(body) }; current = null; body = []; };

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^###\s+(\d+)\s*[·.:–—-]\s*(.+)$/);
    if (!h3 && /^###\s/.test(line)) ignored.push(line.trim());
    if (h2) { close(); ato = h2[1].trim(); atoIntro = []; continue; }
    if (h3) {
      close();
      const intro = atoIntro.length ? render(atoIntro) : "";
      current = { n: h3[1].padStart(2, "0"), title: h3[2].trim(), ato, intro };
      atoIntro = [];
      continue;
    }
    if (current) body.push(line); else if (ato) atoIntro.push(line);
  }
  close();
  writeFileSync(out, JSON.stringify(slides, null, 1) + "\n");
  return { count: Object.keys(slides).length, numbers: Object.keys(slides).map(Number), ignored };
}
