import { CommandContext } from "grammy";
import { sendBookingsPage } from "../utils/paginator";
import { SharedContext } from "@/types/grammy/SessionData";

export const mybookingsCommand = async (ctx: CommandContext<SharedContext>) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;
  await sendBookingsPage(ctx, userId, 1);
};