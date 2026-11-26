// Só tipos, sem imports: o deck importa este arquivo. O papel de cada conexão vem do caminho (/ws é
// a plateia, /apresentador/ws é o palco), nunca de uma mensagem.
export type Link = { label: string; url: string };

// pergunta definida no slide (`poll` em SlideBase); sem ela, a votação é 👍/👎 com a pergunta falada
export type PollSpec = { question: string; options: string[] };

// `counts[i]` é o total da opção `options[i]`; `question` vazia = pergunta falada
export type Poll = { id: number; open: boolean; question: string; options: string[]; counts: number[] };

// envio da tela para a plateia; `v` muda a cada foto (0 = nenhuma ainda) e vai em /tela.jpg?v=
export type Share = { on: boolean; v: number };

export type PublicState = {
  slide: { index: number; title: string };
  links: Link[];
  poll: Poll;
  share: Share;
};

export type StageState = PublicState & { connected: number; bot: boolean; publicUrl: string };

export type RemoteKey = "ArrowRight" | "ArrowLeft" | "b" | "v" | "f";
export type PointerMode = "laser" | "spot";

export type AudienceMessage =
  | { type: "react"; kind: string }
  | { type: "vote"; choice: number; cid?: string } // índice em poll.options
  | { type: "click"; url: string };

export type StageCommand =
  | { type: "bot"; on: boolean }
  | { type: "poll"; open: boolean }
  | { type: "share"; on: boolean };

export type DeckMessage =
  | { type: "slide"; index: number; title: string; links: Link[]; poll?: PollSpec }
  | { type: "view"; index: number; step: number; steps: number; black: boolean; notes: boolean; full: boolean; elapsed: number | null }
  | { type: "shot"; data: string } // data URL JPEG, até 2 MB, só com o envio ligado
  | StageCommand;

export type RemoteMessage =
  | { type: "hello"; as: "remote" }
  | { type: "key"; key: RemoteKey }
  | { type: "pointer"; x: number; y: number; mode: PointerMode; tap: boolean } // 0..1 do slide
  | { type: "pointer"; off: true }
  | StageCommand;

export type ClientMessage = AudienceMessage | DeckMessage | RemoteMessage;

export type BurstMessage = { type: "burst"; h: Record<string, number> };

export type PointerMessage =
  | { type: "pointer"; x: number; y: number; mode: PointerMode; tap: boolean }
  | { type: "pointer"; off: true };

// onde o deck está; `elapsed` é o cronômetro em ms no instante do envio
export type ViewMessage = { type: "view"; index: number; step: number; steps: number; black: boolean; full: boolean; elapsed: number | null; decks: number };

export type ToAudience = { type: "state"; state: PublicState } | BurstMessage;
export type ToDeck = { type: "state"; state: StageState } | BurstMessage | { type: "key"; key: RemoteKey } | PointerMessage;
export type ToRemote = { type: "state"; state: StageState } | BurstMessage | ViewMessage;
export type ServerMessage = ToAudience | ToDeck | ToRemote;
