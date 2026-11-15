import { notFound } from "next/navigation";
import Deck from "@/components/Deck";
import { slides } from "@/components/content";

export function generateStaticParams() {
  return slides.map((_, i) => ({ slide: String(i + 1) }));
}

export default async function SlidePage({ params }: { params: Promise<{ slide: string }> }) {
  const { slide } = await params;
  const n = Number(slide);
  if (!Number.isInteger(n) || n < 1 || n > slides.length) notFound();
  return <Deck index={n - 1} />;
}
