import { Api, Bot, InlineKeyboard, RawApi } from "grammy";
import { sendBookingsPage } from "../utils/paginator";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { SharedContext } from "@/types/grammy/SessionData";
import { BookingService } from "@/services/bookingService";
import { BookingStatus } from "@prisma/client";
import { CallbackAction } from "../constants/callbackActions";
import { callbackPayloads } from "../utils/callbackPayloads";
import { sendHome } from "../controllers/navigationController";

export function handleNavigationCallbacks(bot: Bot<SharedContext, Api<RawApi>>) {
  bot.callbackQuery(CallbackAction.GO_HOME, sendHome);
  
  bot.callbackQuery(CallbackAction.MY_BOOKINGS, async (ctx) => {
    await ctx.answerCallbackQuery();
    
    const telegramUserId = ctx.from?.id.toString();
    if (!telegramUserId) return;
  
    await sendBookingsPage(ctx, telegramUserId, 1);
  });
  
  bot.callbackQuery(CallbackAction.MY_TICKETS, async (ctx) => {
    await ctx.answerCallbackQuery();
  
    const telegramUserId = ctx.from?.id.toString();
    if (!telegramUserId) return;
  
    const user = ctx.sfx.user;
  
    if (!user) {
      await ctx.reply("Пользователь не найден.", extraGoToHomeKeyboard);
      return;
    }
  
    const bookings = await BookingService.getByUserId(user.id, BookingStatus.PAID);
  
    let tickets: {
      ticketId: number;
      eventName: string;
      eventDate: Date;
      eventLocation: string;
      ticketTypeName: string;
    }[] = [];
  
    for (const booking of bookings) {
      for (const bt of booking.bookingTickets) {
        const event = bt.ticket.ticketType.event;
        if (event) {
          tickets.push({
            ticketId: bt.ticket.id,
            eventName: event.name,
            eventDate: event.startDate,
            eventLocation: event.location,
            ticketTypeName: bt.ticket.ticketType.name,
          });
        }
      }
    }
  
    if (tickets.length === 0) {
      await ctx.reply("У вас пока нет активных билетов 😔", extraGoToHomeKeyboard);
      return;
    }
  
    let text = `🎟️ *Ваши билеты:*\n\n`;
    const keyboard = new InlineKeyboard();
  
    tickets.forEach((ticket, index) => {
      text += `*${index + 1}.* ${ticket.eventName}\n📅 ${ticket.eventDate.toLocaleDateString()} | 📍 ${ticket.eventLocation}\nКатегория: ${ticket.ticketTypeName}\n\n`;
      keyboard.text(`🔎 QR ${index + 1}`, callbackPayloads.ticketQr(ticket.ticketId));
      keyboard.row();
    });
  
    keyboard.row();
    keyboard.text('Главное меню', CallbackAction.GO_HOME);
  
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  });
}