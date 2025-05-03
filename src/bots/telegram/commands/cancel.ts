import { CommandContext, Context } from "grammy";
import { extraGoToHomeKeyboard } from "../markups/extraGoToHomeKeyboard";
import { bookingSessions } from "../sessions/bookingSession";

export const cancelCommand = async (ctx: CommandContext<Context>) => {
  const userId = ctx.from?.id.toString();

  if (userId && bookingSessions[userId]) {
    delete bookingSessions[userId];
    await ctx.reply("❌ Бронирование отменено. Вы можете начать заново.", extraGoToHomeKeyboard
    );
  } else {
    await ctx.reply("Нет активного процесса бронирования.", extraGoToHomeKeyboard);
  }
};