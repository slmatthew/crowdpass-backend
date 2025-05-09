import { CommandContext, InlineKeyboard } from "grammy";
import { CallbackAction } from "../constants/callbackActions";
import { SharedContext } from "@/types/grammy/SessionData";

export const supportCommand = async (ctx: CommandContext<SharedContext>) => {
  await ctx.reply(
    `🆘 *Поддержка пользователей:*

Если у вас возникли вопросы или проблемы:
- Напишите на почту: crowdpass@slmatthew.dev
- Или свяжитесь через Telegram: @CrowdPassSupport

Мы всегда на связи! 🚀`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text('Главное меню', CallbackAction.GO_HOME)
    }
  );
};