import type { Poll } from "../../backstage/protocol";

// Sem pergunta e com 👍/👎: a barra única de sempre. Com pergunta ou outras opções: uma barra por opção.
export const isThumbs = (p: Poll) => !p.question && p.options.length === 2 && p.options[0] === "👍" && p.options[1] === "👎";

export const total = (p: Poll) => p.counts.reduce((a, n) => a + n, 0);

// percentual de cada opção, arredondado; 0 em todas enquanto não há voto
export const shares = (p: Poll) => { const n = total(p); return p.counts.map((c) => (n ? Math.round((c / n) * 100) : 0)); };

export const EMPTY_POLL: Poll = { id: 0, open: false, question: "", options: ["👍", "👎"], counts: [0, 0] };
