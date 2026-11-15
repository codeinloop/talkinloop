"use client";

import { useEffect, useRef, useState } from "react";

export default function Count({ to, suffix = "", ms = 1100 }: { to: number; suffix?: string; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.closest(".leave, .preview") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now() + 250;
    const tick = (t: number) => {
      const p = Math.min(Math.max((t - t0) / ms, 0), 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setN(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);

  return <span ref={ref}>{n}{suffix}</span>;
}
