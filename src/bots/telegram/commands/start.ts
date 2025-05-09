import { UserService } from "@/services/userService";
import { UserErrorCodes } from "@/types/errors/UserError";
import { SharedContext } from "@/types/grammy/SessionData";
import { InlineKeyboard, CommandContext } from "grammy";
import { CallbackAction } from "../constants/callbackActions";

export const startCommand = async (ctx: CommandContext<SharedContext>) => {
  const user = ctx.sfx?.user;
  if (!user) return;

  // === Обработка start=link_<code> ===
  const payload = ctx.match;
  if(payload?.startsWith("link_")) {
    const code = payload.slice(5);

    try {
      await UserService.confirmLink(code, user.id);
      return await ctx.reply("✅ Аккаунты успешно связаны! Добро пожаловать 👏");
    } catch (err: any) {
      const message =
        err.code === UserErrorCodes.LINK_CODE_INVALID
          ? "❌ Код недействителен или уже использован"
          : err.message ?? "⚠️ Произошла ошибка";

      console.error('[tg/start/link]', err);

      return await ctx.reply(message);
    }
  }

  // === Стандартное приветствие ===
  const keyboard = new InlineKeyboard()
    .text("📜 Список мероприятий", CallbackAction.SHOW_EVENTS)
    .row()
    .text("🎟️ Мои бронирования", CallbackAction.MY_BOOKINGS)
    .row()
    .text("🎫 Мои билеты", CallbackAction.MY_TICKETS);

  await ctx.reply(
    `👋 Привет, ${user.firstName || "пользователь"}!

Добро пожаловать в *CrowdPass* — вашего помощника в бронировании билетов на мероприятия!

Вы можете:
- Посмотреть доступные мероприятия
- Забронировать билеты
- Управлять своими бронированиями
- Получить билеты с QR-кодом для прохода

Выберите действие ниже 👇`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
};
