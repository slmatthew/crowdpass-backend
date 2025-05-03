import { CommandContext, Context } from "grammy";
import { sendEventsPage } from "../utils/paginator";

export const eventsCommand = async (ctx: CommandContext<Context>) => {
  await sendEventsPage(ctx, 1);
};