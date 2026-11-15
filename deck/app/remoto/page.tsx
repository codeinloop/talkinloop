import type { Metadata, Viewport } from "next";
import Remote from "@/components/Remote";
import { config } from "@/components/config";
import { t } from "@/components/i18n";

export const metadata: Metadata = {
  title: `${t.remote.title} · ${config.title}`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#13181f",
};

export default function RemotePage() {
  return <Remote />;
}
