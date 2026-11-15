import type { ComponentType } from "react";
// talk.generated.ts é escrito por scripts/prepare.mjs e aponta para talks/<TALK>.
import { Backdrop as talkBackdrop, slides as talkSlides } from "@/components/talk.generated";
import type { BackdropProps, SlideBase } from "@/components/types";

export const slides: SlideBase[] = talkSlides;
export const Backdrop = talkBackdrop as unknown as ComponentType<BackdropProps> | undefined;
