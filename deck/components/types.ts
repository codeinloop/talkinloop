import type { CSSProperties, ReactNode } from "react";

export type { Link } from "../../backstage/protocol";
import type { Link } from "../../backstage/protocol";

export type SlideBase = {
  title: string;
  block: string;
  minute: string;     // minuto de início ("m:ss"); o cronômetro compara com ele
  top?: boolean;
  kind?: "title" | "statement" | "final";
  links?: Link[];
  content: ReactNode;
  notes: ReactNode;
};

export type BackdropProps<S extends SlideBase = SlideBase> = {
  slide: S;
  step: number;
  steps: number;
  print?: boolean;
  style?: CSSProperties;
};
