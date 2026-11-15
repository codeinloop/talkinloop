import type { Config } from "./config.ts";
import type { Report, TimelinePoint } from "./metrics.ts";
import type { Link } from "./protocol.ts";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
const dur = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

const CSS = `
  :root { --bg: #13181f; --surface: #1b222d; --fg: #f2ede2; --muted: #b6b0a2; --line: #3a4453; --accent: #e9ad40; --warn: #ef8d73; --ok: #6cc48f; }
  * { box-sizing: border-box; } body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.45 ui-sans-serif, system-ui, -apple-system, sans-serif; }
  main { max-width: 1040px; margin: 0 auto; padding: 24px 16px 48px; }
  h1 { margin: 0; font-size: 26px; } h2 { margin: 32px 0 10px; font: 600 13px ui-monospace, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); }
  .muted { color: var(--muted); } header p { margin: 4px 0 0; color: var(--muted); font-size: 14px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 20px; }
  .card { background: var(--surface); border: 2px solid var(--line); border-radius: 12px; padding: 12px 14px; display: grid; gap: 2px; }
  .card b { font-size: 30px; line-height: 1.1; font-variant-numeric: tabular-nums; } .card span { color: var(--muted); font-size: 14px; } .card small { color: var(--muted); font-size: 12px; }
  svg { width: 100%; height: auto; display: block; background: var(--surface); border: 2px solid var(--line); border-radius: 12px; }
  svg text { fill: var(--muted); font: 11px ui-monospace, Menlo, monospace; } svg .axis { stroke: var(--line); }
  svg .aud { fill: none; stroke: var(--accent); stroke-width: 2.5; } svg .hum { fill: var(--ok); opacity: .8; } svg .bot { fill: var(--ok); opacity: .3; }
  .legend { font-size: 13px; color: var(--muted); } .legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin: 0 4px 0 12px; vertical-align: -1px; }
  .l-aud { background: var(--accent); } .l-hum { background: var(--ok); } .l-bot { background: var(--ok); opacity: .35; }
  .scroll { overflow-x: auto; } table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--line); white-space: nowrap; } th { color: var(--muted); font-weight: 500; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; } td.t { white-space: normal; min-width: 200px; } a { color: var(--accent); }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 36px; } .actions a, .actions button { font: inherit; color: var(--fg); background: var(--surface); border: 2px solid var(--line); border-radius: 10px; padding: 8px 14px; text-decoration: none; cursor: pointer; }
  .actions button { border-color: var(--warn); color: var(--warn); }
`;

export function renderReport(r: Report, links: Link[], config: Config): string {
  const t = config.t.report;
  const when = { timeZone: config.timeZone };
  const time = (v: string | null) => (v ? new Date(v).toLocaleTimeString(config.lang, { ...when, hour: "2-digit", minute: "2-digit" }) : "—");
  const dateTime = (v: string | null) => (v ? new Date(v).toLocaleString(config.lang, { ...when, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");

  function chart(timeline: TimelinePoint[]): string {
    const first = timeline[0], last = timeline[timeline.length - 1];
    if (!first || !last || timeline.length < 2) return `<p class="muted">${esc(t.timelineEmpty)}</p>`;
    const W = 960, H = 220, P = { l: 40, r: 12, t: 12, b: 26 };
    const t0 = Date.parse(first.t), t1 = Date.parse(last.t);
    const span = Math.max(1, t1 - t0);
    const maxA = Math.max(1, ...timeline.map((p) => p.a));
    const maxR = Math.max(1, ...timeline.map((p) => p.r + p.b));
    const x = (v: string) => P.l + ((Date.parse(v) - t0) / span) * (W - P.l - P.r);
    const yA = (a: number) => H - P.b - (a / maxA) * (H - P.t - P.b);
    const bw = Math.max(1, ((W - P.l - P.r) / timeline.length) * 0.8);
    const bars = timeline.map((p) => {
      const hb = ((p.r + p.b) / maxR) * (H - P.t - P.b) * 0.6, hh = (p.r / maxR) * (H - P.t - P.b) * 0.6;
      return `<rect class="bot" x="${(x(p.t) - bw / 2).toFixed(1)}" y="${(H - P.b - hb).toFixed(1)}" width="${bw.toFixed(1)}" height="${hb.toFixed(1)}"/>` +
        `<rect class="hum" x="${(x(p.t) - bw / 2).toFixed(1)}" y="${(H - P.b - hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}"/>`;
    }).join("");
    const line = timeline.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${yA(p.a).toFixed(1)}`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t.timelineAria)}">
    <line class="axis" x1="${P.l}" y1="${H - P.b}" x2="${W - P.r}" y2="${H - P.b}"/>
    <text x="${P.l - 6}" y="${P.t + 10}" text-anchor="end">${maxA}</text><text x="${P.l - 6}" y="${H - P.b}" text-anchor="end">0</text>
    <text x="${P.l}" y="${H - 6}">${time(first.t)}</text><text x="${W - P.r}" y="${H - 6}" text-anchor="end">${time(last.t)}</text>
    ${bars}<path class="aud" d="${line}"/>
  </svg>
  <p class="legend"><i class="l-aud"></i>${esc(t.connected)} (${esc(t.max)} ${maxA}) <i class="l-hum"></i>${esc(t.audienceReactions)} <i class="l-bot"></i>${esc(t.botReactions)} <span class="muted">(${esc(t.per10s)}, ${esc(t.max)} ${maxR})</span></p>`;
  }

  const emoji = Object.fromEntries(config.reactions.map((k) => [k.id, k.emoji]));
  const label = Object.fromEntries(links.map((l) => [l.url, l.label]));
  const kinds = Object.entries(r.reactions.byKind).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${esc(emoji[k] || k)} ${n}`).join(" · ") || "—";
  const clicks = Object.entries(r.linkClicks).sort((a, b) => b[1] - a[1]);
  const totalClicks = clicks.reduce((a, [, n]) => a + n, 0);
  const totalVotes = r.polls.reduce((a, p) => a + p.up + p.down, 0);
  const card = (n: number, text: string, sub = "") => `<div class="card"><b>${n}</b><span>${esc(text)}</span>${sub ? `<small>${sub}</small>` : ""}</div>`;
  const pad = (n: number) => String(n).padStart(2, "0");
  const empty = (cols: number, text: string) => `<tr><td colspan="${cols}" class="muted">${esc(text)}</td></tr>`;

  return `<!doctype html><html lang="${esc(config.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.title)} · ${esc(config.title)}</title><meta name="robots" content="noindex">
<style>${CSS}</style><style>${config.theme}</style></head><body><main>
<header>
  <h1>${esc(t.title)}</h1>
  <p>${esc(t.since)} ${dateTime(r.startedAt)} · ${esc(t.updated)} ${dateTime(r.updatedAt)} ${r.persisted ? "" : `· <b>${esc(t.memoryOnly)}</b>`}</p>
</header>
<div class="cards">
  ${card(r.peak.audience, t.peak, r.peak.at ? `${esc(t.at)} ${time(r.peak.at)}` : "")}
  ${card(r.uniqueDevices, t.devices)}
  ${card(r.pageViews, t.pageViews)}
  ${card(r.reactions.human, t.audienceReactions, kinds)}
  ${card(r.reactions.bot, t.botReactions, esc(t.countedApart))}
  ${card(r.polls.length, t.polls, `${totalVotes} ${esc(t.votes)}`)}
  ${card(totalClicks, t.clicks)}
</div>
<h2>${esc(t.timeline)}</h2>
${chart(r.timeline)}
<h2>${esc(t.bySlide)}</h2>
<div class="scroll"><table><thead><tr><th>#</th><th>${esc(t.slide)}</th><th class="n">${esc(t.time)}</th><th class="n">${esc(t.reactions)}</th><th class="n">${esc(t.peak)}</th><th>${esc(t.enteredAt)}</th></tr></thead><tbody>
${r.slides.map((s) => `<tr><td>${pad(s.slide)}</td><td class="t">${esc(s.title)}</td><td class="n">${dur(s.timeMs)}</td><td class="n">${s.reactions}</td><td class="n">${s.peakAudience}</td><td>${time(s.firstAt)}</td></tr>`).join("") || empty(6, t.noSlides)}
</tbody></table></div>
<h2>${esc(t.pollsTitle)}</h2>
<div class="scroll"><table><thead><tr><th>#</th><th>${esc(t.slide)}</th><th class="n">👍</th><th class="n">👎</th><th>${esc(t.openedAt)}</th><th>${esc(t.duration)}</th></tr></thead><tbody>
${r.polls.map((p) => `<tr><td>${p.n}</td><td class="t">${p.slide ? pad(p.slide) + " · " : ""}${esc(p.slideTitle)}</td><td class="n">${p.up}</td><td class="n">${p.down}</td><td>${time(p.openedAt)}</td><td>${p.closedAt ? dur(Date.parse(p.closedAt) - Date.parse(p.openedAt)) : esc(t.open)}</td></tr>`).join("") || empty(6, t.noPolls)}
</tbody></table></div>
<h2>${esc(t.clicksTitle)}</h2>
<div class="scroll"><table><thead><tr><th>${esc(t.link)}</th><th class="n">${esc(t.clicksCol)}</th></tr></thead><tbody>
${clicks.map(([u, n]) => `<tr><td class="t"><a href="${esc(u)}" target="_blank" rel="noopener">${esc(label[u] || u)}</a></td><td class="n">${n}</td></tr>`).join("") || empty(2, t.noClicks)}
</tbody></table></div>
<div class="actions">
  <a href="metricas.json" download>${esc(t.download)}</a>
  ${r.archives.map((f) => `<a href="metricas/arquivo/${encodeURIComponent(f)}" download>${esc(f)}</a>`).join("")}
  <button id="zerar" type="button">${esc(t.reset)}</button>
</div>
</main>
<script>
  document.getElementById("zerar").addEventListener("click", async () => {
    if (!confirm(${JSON.stringify(t.confirmReset)})) return;
    await fetch("metricas/zerar", { method: "POST" });
    location.reload();
  });
</script>
</body></html>`;
}
