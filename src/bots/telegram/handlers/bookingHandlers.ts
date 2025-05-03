import { Api, Bot, Context, InlineKeyboard, RawApi } from "grammy";
import { extraGoToHomeKeyboard } from "../markups/extraGoToHomeKeyboard";
import { bookingSessions } from "../sessions/bookingSession";
import { sendBookingsPage } from "../utils/paginator";
import { bookingTimeouts } from "../sessions/bookingTimeouts";
import { BookingService } from "@/services/bookingService";
import { BookingError } from "@/types/errors/BookingError";
import { EventService } from "@/services/eventService";
import { TicketService } from "@/services/ticketService";
import { SharedContext } from "@/types/grammy/SessionData";

export function handleBookingCallbacks(bot: Bot<SharedContext, Api<RawApi>>) {
  bot.callbackQuery(/^book_(\d+)_(\d+)$/, async (ctx) => {
    const eventId = Number(ctx.match[1]);
    const fromPage = Number(ctx.match[2]);
    const userId = ctx.from?.id.toString();
  
    if (!userId) {
      await ctx.answerCallbackQuery({ text: "Ошибка авторизации." });
      return;
    }
  
    bookingSessions[userId] = { eventId, fromPage };

    bookingTimeouts[userId] = setTimeout(async () => {
      if (bookingSessions[userId]) {
        await ctx.reply(`🔔 Вы начали бронирование, но пока не завершили его.
  Пожалуйста, завершите бронирование или отмените через /cancel.`);
        delete bookingTimeouts[userId]; // Чистим таймер после напоминания
      }
    }, 120000); // 2 минуты
  
    const ticketTypes = await TicketService.getTicketTypesForEvent(eventId, true);
  
    if (ticketTypes.length === 0) {
      await ctx.editMessageText("К сожалению, для этого мероприятия нет доступных билетов.", extraGoToHomeKeyboard);
      await ctx.answerCallbackQuery();
      return;
    }
  
    const keyboard = new InlineKeyboard();
  
    ticketTypes.forEach((type) => {
      const availableCount = type.tickets.filter(t => t.status === "AVAILABLE").length;
      if (availableCount > 0) {
        keyboard.text(`${type.name} — ${type.price}₽ (${availableCount} шт.)`, `selectType_${type.id}`);
        keyboard.row();
      }
    });
  
    keyboard.text("⬅️ Назад к мероприятию", `back_to_event_${eventId}_${fromPage}`);
  
    await ctx.editMessageText(
      "🎟️ Выберите тип билета:",
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^back_to_event_(\d+)_(\d+)$/, async (ctx) => {
    const eventId = Number(ctx.match[1]);
    const fromPage = Number(ctx.match[2]);
  
    const event = await EventService.getEventById(eventId);
  
    if (!event) {
      await ctx.answerCallbackQuery({ text: "Мероприятие не найдено." });
      return;
    }
  
    const keyboard = new InlineKeyboard()
      .text("🎟️ Забронировать билет", `book_${eventId}_${fromPage}`)
      .row()
      .text("⬅️ Назад к мероприятиям", `back_to_events_${fromPage}`);
  
    await ctx.editMessageText(
      `🎫 *${event.name}*\n\n${event.description}\n\n📅 Дата: ${event.startDate.toLocaleString()}\n📍 Место: ${event.location}`,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^selectType_(\d+)$/, async (ctx) => {
    const ticketTypeId = Number(ctx.match[1]);
    const userId = ctx.from?.id.toString();
  
    if (!userId || !bookingSessions[userId]) {
      await ctx.answerCallbackQuery({ text: "❌ Бронирование отменено или истекло. Пожалуйста, начните заново" });
      return;
    }
  
    bookingSessions[userId].ticketTypeId = ticketTypeId;
  
    await ctx.editMessageText(
      "🎟️ Сколько билетов вы хотите забронировать?\n\nОтправьте число (например, 2) или /cancel для отмены",
      { parse_mode: "Markdown" }
    );
  
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^cancel_(\d+)_(\d+)$/, async (ctx) => {
    const bookingId = Number(ctx.match[1]);
    const page = Number(ctx.match[2]);
    const userId = ctx.from?.id.toString();

    if (!userId || !ctx.sfx.user?.id) {
      await ctx.reply("❗ Ошибка данных. Пожалуйста, попробуйте позже");
    }

    try {
      await BookingService.cancelBooking(bookingId);
      await ctx.answerCallbackQuery({ text: "✅ Бронь отменена." });
      await sendBookingsPage(ctx, userId, page, true);
    } catch(err) {
      if(err instanceof BookingError) {
        console.error(`[BookingCancel/${err.code}] ${err.message}`, err.metadata);

        await ctx.answerCallbackQuery(`❗ ${err.message}`);
      } else {
        console.error(`[BookingCancel]`, err);
        await ctx.answerCallbackQuery(`❗ Произошла ошибка, попробуйте ещё раз`);
      }
    }
  });

  bot.callbackQuery(/^mybookings_page_(\d+)$/, async (ctx) => {
    const page = Number(ctx.match[1]);
    const userId = ctx.from?.id.toString();
    if (!userId) return;
    await ctx.answerCallbackQuery();
    await sendBookingsPage(ctx, userId, page, true);
  });

  bot.callbackQuery(/^confirm_booking_(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    if (!userId || !bookingSessions[userId]) {
      await ctx.answerCallbackQuery();
      await ctx.reply("⚠️ Бронирование не найдено или уже отменено.");
      return;
    }

    const session = bookingSessions[userId!];

    if (!session.ticketTypeId || !session.ticketsCount || !ctx.sfx.user?.id) {
      await ctx.reply("❗ Ошибка данных. Пожалуйста, начните бронирование заново.");
      delete bookingSessions[userId];
      return;
    }

    try {
      const booking = await BookingService.makeBooking(ctx.sfx.user?.id, session.ticketTypeId, session.ticketsCount);
      
      await ctx.editMessageText(
        `✅ Вы успешно забронировали ${session.ticketsCount} билет(а/ов)!\n\nНомер бронирования: ${booking.id}`,
        extraGoToHomeKeyboard
      );
    } catch(err) {
      if(err instanceof BookingError) {
        console.error(`[BookingMake/${err.code}] ${err.message}`, err.metadata);

        await ctx.editMessageText(
          `❗ ${err.message}`,
          extraGoToHomeKeyboard
        );
      } else {
        console.error(`[BookingMake]`, err);
        await ctx.editMessageText(
          `❗ Произошла ошибка, попробуйте ещё раз`,
          extraGoToHomeKeyboard
        );
      }
    } finally {
      if (bookingTimeouts[userId]) {
        clearTimeout(bookingTimeouts[userId]);
        delete bookingTimeouts[userId];
      }
  
      delete bookingSessions[userId];    
  
      await ctx.answerCallbackQuery();
    }
  });

  bot.callbackQuery(/^cancel_booking_(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    if (!userId) return;

    if (bookingTimeouts[userId]) {
      clearTimeout(bookingTimeouts[userId]);
      delete bookingTimeouts[userId];
    }

    delete bookingSessions[userId];

    await ctx.answerCallbackQuery();
    await ctx.editMessageText("❌ Бронирование отменено", extraGoToHomeKeyboard);
  });
}