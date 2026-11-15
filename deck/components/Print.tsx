"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Backdrop, slides } from "@/components/content";
import Chrome from "@/components/Chrome";
import { BUILD_PUBLIC_URL } from "@/components/config";
import { t } from "@/components/i18n";
import { PrintContext } from "@/components/preview";

const total = slides.length;

export default function Print() {
  const root = useRef<HTMLDivElement>(null);
  const [light, setLight] = useState(false);
  const [only, setOnly] = useState<number | null>(null);

  useLayoutEffect(() => { root.current?.querySelectorAll("[data-frag]").forEach((f) => f.classList.add("frag-on")); }, [only]);

  useLayoutEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setLight(query.get("tema") === "claro");
    const folha = Number(query.get("folha"));
    if (Number.isInteger(folha) && folha >= 1 && folha <= total) setOnly(folha - 1);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = light ? "light" : "";
  }, [light]);

  useEffect(() => {
    const fit = () => root.current?.style.setProperty("--z", String(Math.min(1, (window.innerWidth - 48) / 1600)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <PrintContext.Provider value={true}>
      <div ref={root} className={`print-deck preview ${only !== null ? "single" : ""}`}>
        <div className="print-bar">
          <b>{total} {t.print.slides}</b>
          <button className="primary" onClick={() => window.print()}>{t.print.save}</button>
          <button onClick={() => setLight((v) => !v)}>{light ? t.print.darkTheme : t.print.lightTheme}</button>
          <span>{t.print.hint}</span>
        </div>
        {slides.map((s, i) => (only !== null && i !== only ? null : (
          <section key={i} className="print-page" aria-label={`${i + 1}. ${s.title}`}>
            {Backdrop && <Backdrop slide={s} step={0} steps={0} print />}
            <div className={`slide ${s.top ? "top" : ""} ${s.kind ?? ""}`}>{s.content}</div>
            <Chrome kind={s.kind} index={i} total={total} url={BUILD_PUBLIC_URL} />
          </section>
        )))}
      </div>
    </PrintContext.Provider>
  );
}
