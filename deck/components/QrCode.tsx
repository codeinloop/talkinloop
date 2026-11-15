import { useMemo } from "react";
import QRCode from "qrcode";

export const qrLabel = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/+$/, "");

export default function QrCode({ url, className }: { url: string; className?: string }) {
  const qr = useMemo(() => {
    try {
      const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
      const n = modules.size;
      let d = "";
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (modules.data[y * n + x]) d += `M${x} ${y}h1v1h-1z`;
      return { size: n, path: d };
    } catch { return null; }
  }, [url]);
  if (!qr) return null;
  const s = qr.size;
  return (
    <svg className={className} viewBox={`-2 -2 ${s + 4} ${s + 4}`} shapeRendering="crispEdges" role="img" aria-label={`QR code: ${qrLabel(url)}`}>
      <rect x={-2} y={-2} width={s + 4} height={s + 4} fill="#fff" />
      <path d={qr.path} fill="#0d121c" />
    </svg>
  );
}
