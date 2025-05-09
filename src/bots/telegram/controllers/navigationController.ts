import { InlineKeyboard } from "grammy";
import { ControllerContext } from "./ControllerContext";
import { CallbackAction } from "../constants/callbackActions";

export async function sendHome(ctx: ControllerContext) {
  const keyboard = new InlineKeyboard()
    .text("📜 Список мероприятий", CallbackAction.EVENTS_CHOICE_CATEGORY)
    .row()
    .text("🎟️ Мои бронирования", CallbackAction.MY_BOOKINGS)
    .row()
    .text("🎫 Мои билеты", CallbackAction.MY_TICKETS);

  const text = `👋 Добро пожаловать в *CrowdPass*!

Это главное меню. Выберите действие ниже 👇`;

  try {
    await ctx.editMessageText(
      text,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );

    await ctx.answerCallbackQuery();
  } catch(err) {
    await ctx.reply(
      text,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  }
}