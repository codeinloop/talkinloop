// Prefixo do deck (basePath do next.config.ts). O Next aplica sozinho em <Link> e no router;
// caminhos escritos à mão (img, video, history.replaceState) precisam dele.
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function liveUrl() {
  if (process.env.NEXT_PUBLIC_LIVE_URL) return process.env.NEXT_PUBLIC_LIVE_URL;
  return `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}${BASE}/ws`;
}

export function sample(counts: Record<string, number>, max: number): string[] {
  const bag: string[] = [];
  for (const [k, n] of Object.entries(counts)) for (let i = 0; i < Math.min(n, max); i++) bag.push(k);
  for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
  return bag.slice(0, max);
}
