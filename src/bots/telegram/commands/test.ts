import { SharedContext } from "@/types/grammy/SessionData";
import { CommandContext } from "grammy";
import { sendCategoryChoice } from "../controllers/eventsController";

export const testCommand = async (ctx: CommandContext<SharedContext>) => sendCategoryChoice(ctx);