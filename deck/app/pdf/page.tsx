import type { Metadata } from "next";
import Print from "@/components/Print";
import { config } from "@/components/config";

export const metadata: Metadata = { title: `${config.title} · PDF` };

export default function PdfPage() {
  return <Print />;
}
