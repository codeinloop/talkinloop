import type { CSSProperties, ReactNode } from "react";

export type { Link, PollSpec } from "../../backstage/protocol";
import type { Link, PollSpec } from "../../backstage/protocol";

export type SlideBase = {
  title: string;
  block: string;
  minute: string;     // minuto de início ("m:ss"); o cronômetro compara com ele
  top?: boolean;
  kind?: "title" | "statement" | "final";
  links?: Link[];
  poll?: PollSpec;     // pergunta e opções da votação deste slide; sem ela, 👍/👎
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
