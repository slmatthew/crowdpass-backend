import { SharedContext } from "@/types/grammy/SessionData";
import { CommandContext } from "grammy";

export const helpCommand = async (ctx: CommandContext<SharedContext>) => {
  await ctx.reply(
    `ℹ️ *Команды бота:*

/start — Начать работу с ботом
/help — Посмотреть это меню помощи
/events — Список доступных мероприятий
/mybookings — Мои активные бронирования
/mytickets — Мои активные билеты
/cancel — Отменить текущее бронирование

👨‍💻 Если возникнут вопросы — пишите организаторам!`,
    { parse_mode: "Markdown" }
  );
};