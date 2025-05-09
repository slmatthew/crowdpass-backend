import { CommandContext, InlineKeyboard } from "grammy";
import { CallbackAction } from "../constants/callbackActions";
import { SharedContext } from "@/types/grammy/SessionData";

export const aboutCommand = async (ctx: CommandContext<SharedContext>) => {
  await ctx.reply(
    `ℹ️ *О проекте CrowdPass:*

CrowdPass — это сервис для бронирования билетов на мероприятия.  
Вы можете:
- Просматривать список событий
- Бронировать билеты
- Получать QR-коды для прохода на мероприятия

Проект разработан в рамках дипломной работы по направлению "Информационные системы и программирование".

Спасибо, что пользуетесь нашим сервисом! 🚀`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text('Главное меню', CallbackAction.GO_HOME)
    }
  );
};