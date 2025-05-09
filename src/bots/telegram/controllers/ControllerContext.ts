import { SharedContext } from "@/types/grammy/SessionData";
import { CallbackQueryContext, CommandContext } from "grammy";
import { PreCheckoutQueryContext } from "grammy/out/context";

export type ControllerContext = CommandContext<SharedContext> | CallbackQueryContext<SharedContext> | PreCheckoutQueryContext<SharedContext>;