"use client";

import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { BASE } from "@/components/base";
import { t } from "@/components/i18n";
import { PreviewContext, PrintContext } from "@/components/preview";

export default function Demo({ src: path, fallback }: { src: string; fallback: ReactNode }) {
  const src = BASE + path;
  const preview = useContext(PreviewContext);
  const print = useContext(PrintContext);
  const ref = useRef<HTMLVideoElement>(null);
  const [missing, setMissing] = useState(false);
  const [playing, setPlaying] = useState(false);

  // o export estático não sabe se o arquivo existe: confere antes de mostrar o player
  useEffect(() => {
    if (preview || print) return;
    let alive = true;
    fetch(src, { method: "HEAD" }).then((r) => { if (alive && !r.ok) setMissing(true); }).catch(() => { if (alive) setMissing(true); });
    return () => { alive = false; };
  }, [src, preview, print]);

  useEffect(() => {
    if (preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "v" && e.key !== "V") return;
      const v = ref.current;
      if (!v || missing) return;
      if (v.paused) v.play().catch(() => {}); else v.pause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [missing, preview]);

  if (print) return <>{fallback}</>;
  if (preview) return <div className="demo-preview" data-video="1">{t.deck.videoPreview}</div>;
  if (missing) return <>{fallback}</>;
  return (
    <div className={`demo ${playing ? "playing" : ""}`}>
      <video
        ref={ref}
        src={src}
        preload="auto"
        playsInline
        onError={() => setMissing(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={(e) => { e.stopPropagation(); const v = e.currentTarget; v.paused ? v.play().catch(() => {}) : v.pause(); }}
      />
      <span className="demo-hint">{t.deck.videoHint}</span>
    </div>
  );
}
