import { SessionFlavor } from "grammy";
import { SfxContext } from "./SfxContext";

export interface SessionData {
  step: 'link.awaiting_vk' | null;
  tempValue?: string;
}

export type SharedContext = SfxContext & SessionFlavor<SessionData>;