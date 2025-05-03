import { CommandContext, Context } from "grammy";
import { sendBookingsPage } from "../utils/paginator";

export const mybookingsCommand = async (ctx: CommandContext<Context>) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;
  await sendBookingsPage(ctx, userId, 1);
};