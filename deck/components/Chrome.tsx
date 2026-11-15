import type { CSSProperties } from "react";
import QrCode, { qrLabel } from "@/components/QrCode";
import { config } from "@/components/config";
import { t } from "@/components/i18n";

export default function Chrome({ kind, index, total, url, style }: { kind?: string; index: number; total: number; url: string; style?: CSSProperties }) {
  return (
    <div className={`frame chrome ${kind ?? ""}`} style={style} aria-hidden="true">
      <div className="brand">
        <b>{config.author.name}</b>
        <span>{config.author.tagline}</span>
      </div>
      {config.poweredBy !== false && (
        <a className="powered" href="https://talkinloop.codeinloop.com.br" target="_blank" rel="noopener">{t.deck.poweredBy}</a>
      )}
      <div className="qr">
        <div className="qr-meta">
          {url && <span>{qrLabel(url)}</span>}
          <small>{String(index + 1).padStart(2, "0")} / {total}</small>
        </div>
        {url && <QrCode url={url} className="qr-code" />}
      </div>
    </div>
  );
}
