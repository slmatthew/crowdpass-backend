import { CommandContext, Context, InlineKeyboard } from "grammy";

export const supportCommand = async (ctx: CommandContext<Context>) => {
  await ctx.reply(
    `🆘 *Поддержка пользователей:*

Если у вас возникли вопросы или проблемы:
- Напишите на почту: crowdpass@slmatthew.dev
- Или свяжитесь через Telegram: @CrowdPassSupport

Мы всегда на связи! 🚀`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text('Главное меню', 'go_to_home')
    }
  );
};