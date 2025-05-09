import { CommandContext } from "grammy";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { bookingSessions } from "../sessions/bookingSession";
import { SharedContext } from "@/types/grammy/SessionData";

export const cancelCommand = async (ctx: CommandContext<SharedContext>) => {
  const userId = ctx.from?.id.toString();

  if (userId && bookingSessions[userId]) {
    delete bookingSessions[userId];
    await ctx.reply("❌ Бронирование отменено. Вы можете начать заново.", extraGoToHomeKeyboard
    );
  } else {
    await ctx.reply("Нет активного процесса бронирования.", extraGoToHomeKeyboard);
  }
};