import { SharedContext } from "@/types/grammy/SessionData";
import { CallbackQueryContext, CommandContext } from "grammy";

export type ControllerContext = CommandContext<SharedContext> | CallbackQueryContext<SharedContext>;