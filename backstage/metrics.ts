import fs from "node:fs";
import path from "node:path";

const TIMELINE_MAX = 20000;
const iso = (t = Date.now()) => new Date(t).toISOString();

type SlideRecord = { title: string; timeMs: number; reactions: number; peakAudience: number; firstAt: string };
// `up`/`down` só existem em métricas gravadas antes da votação com opções
export type PollRecord = {
  n: number; slide: number | null; slideTitle: string; openedAt: string; closedAt: string | null;
  question?: string; options?: string[]; counts?: number[]; up?: number; down?: number;
};
export type TimelinePoint = { t: string; a: number; r: number; b: number; v: number; s: number | null };

type Stored = {
  version: 1;
  startedAt: string;
  updatedAt: string | null;
  pageViews: number;
  devices: string[];
  peak: { audience: number; at: string | null };
  reactions: { human: number; bot: number; byKind: Record<string, number> };
  linkClicks: Record<string, number>;
  slides: Record<string, SlideRecord>;
  polls: PollRecord[];
  timeline: TimelinePoint[];
};

export type Report = Omit<Stored, "devices" | "slides"> & {
  uniqueDevices: number;
  slides: { slide: number; title: string; reactions: number; peakAudience: number; firstAt: string; timeMs: number }[];
  persisted: boolean;
  archives: string[];
};

type Tally = { question: string; options: string[]; counts: number[] };

function blank(): Stored {
  return {
    version: 1, startedAt: iso(), updatedAt: null,
    pageViews: 0, devices: [], peak: { audience: 0, at: null },
    reactions: { human: 0, bot: 0, byKind: {} },
    linkClicks: {}, slides: {}, polls: [], timeline: [],
  };
}

export function createMetrics({ dataDir, getAudience }: { dataDir: string | undefined; getAudience: () => number }) {
  const file = dataDir ? path.join(dataDir, "metrics.json") : null;
  let m = load() ?? blank();
  let devices = new Set(m.devices);
  let win = { r: 0, b: 0, v: 0 };
  let current: { index: number; title: string; at: number } | null = null;
  let livePoll: PollRecord | null = null;

  function load(): Stored | null {
    if (!file) return null;
    try { return JSON.parse(fs.readFileSync(file, "utf8")) as Stored; } catch { return null; }
  }
  function save() {
    if (!file || !dataDir) return;
    if (current) settleSlide(Date.now());
    m.devices = [...devices];
    m.updatedAt = iso();
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(file + ".tmp", JSON.stringify(m));
      fs.renameSync(file + ".tmp", file);
    } catch (e) { console.error("metrics: save failed", e instanceof Error ? e.message : e); }
  }
  const slideRec = (index: number, title: string): SlideRecord => (m.slides[index] ??= { title, timeMs: 0, reactions: 0, peakAudience: 0, firstAt: iso() });
  function settleSlide(now: number) {
    if (!current) return;
    slideRec(current.index, current.title).timeMs += now - current.at;
    current.at = now;
  }
  function peak(n: number) {
    if (n > m.peak.audience) m.peak = { audience: n, at: iso() };
    if (current) { const s = slideRec(current.index, current.title); s.peakAudience = Math.max(s.peakAudience, n); }
  }
  function archives(): string[] {
    if (!file || !dataDir) return [];
    try { return fs.readdirSync(dataDir).filter((f) => /^metrics-.*\.json$/.test(f)).sort().reverse(); } catch { return []; }
  }

  return {
    pageView() { m.pageViews++; },
    device(cid: string | null) { if (cid) devices.add(cid); },
    audienceChanged(n: number) { peak(n); },
    reaction(kind: string, bot: boolean) {
      if (bot) { m.reactions.bot++; win.b++; return; }
      m.reactions.human++; win.r++;
      m.reactions.byKind[kind] = (m.reactions.byKind[kind] || 0) + 1;
      if (current) slideRec(current.index, current.title).reactions++;
    },
    click(url: string) { m.linkClicks[url] = (m.linkClicks[url] || 0) + 1; },
    slide(index: number, title: string) {
      if (current && current.index === index) return; // duas janelas do deck mandam o mesmo slide
      const now = Date.now();
      settleSlide(now);
      current = { index, title, at: now };
      slideRec(index, title);
    },
    pollOpen(poll: Tally) {
      livePoll = {
        n: m.polls.length + 1, slide: current ? current.index + 1 : null, slideTitle: current ? current.title : "", openedAt: iso(), closedAt: null,
        question: poll.question, options: [...poll.options], counts: [...poll.counts],
      };
      m.polls.push(livePoll);
    },
    pollVote(poll: Tally) { win.v++; if (livePoll) livePoll.counts = [...poll.counts]; },
    pollClose(poll: Tally) {
      if (!livePoll) return;
      livePoll.counts = [...poll.counts]; livePoll.closedAt = iso();
      livePoll = null;
    },
    tick() {
      const n = getAudience();
      peak(n);
      if (n > 0 || win.r || win.b || win.v) {
        m.timeline.push({ t: iso(), a: n, r: win.r, b: win.b, v: win.v, s: current ? current.index + 1 : null });
        if (m.timeline.length > TIMELINE_MAX) m.timeline.splice(0, m.timeline.length - TIMELINE_MAX);
      }
      win = { r: 0, b: 0, v: 0 };
      save();
    },
    save,
    reset(): string | null {
      save();
      let archived: string | null = null;
      if (file && dataDir && fs.existsSync(file)) {
        archived = `metrics-${m.startedAt.replace(/[:.]/g, "-")}.json`;
        try { fs.renameSync(file, path.join(dataDir, archived)); } catch (e) { console.error("metrics: archive failed", e instanceof Error ? e.message : e); archived = null; }
      }
      const keep = current;
      m = blank(); devices = new Set(); win = { r: 0, b: 0, v: 0 }; livePoll = null;
      current = keep ? { ...keep, at: Date.now() } : null;
      save();
      return archived;
    },
    report(): Report {
      const now = Date.now();
      const slides = Object.entries(m.slides).map(([i, s]) => ({
        slide: Number(i) + 1, title: s.title, reactions: s.reactions, peakAudience: s.peakAudience, firstAt: s.firstAt,
        timeMs: s.timeMs + (current && current.index === Number(i) ? now - current.at : 0),
      })).sort((a, b) => a.slide - b.slide);
      const { devices: _ids, slides: _slides, ...rest } = m;
      return { ...rest, uniqueDevices: devices.size, slides, persisted: Boolean(file), archives: archives() };
    },
  };
}
