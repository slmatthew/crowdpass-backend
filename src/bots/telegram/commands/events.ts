import { CommandContext } from "grammy";
import { sendAllEvents } from "../controllers/eventsController";
import { SharedContext } from "@/types/grammy/SessionData";

export const eventsCommand = async (ctx: CommandContext<SharedContext>) => {
  await sendAllEvents(ctx);
};