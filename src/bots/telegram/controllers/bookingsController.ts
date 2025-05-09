import { TicketService } from "@/services/ticketService";
import { bookingSessions } from "../sessions/bookingSession";
import { bookingTimeouts } from "../sessions/bookingTimeouts";
import { ControllerContext } from "./ControllerContext";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { InlineKeyboard } from "grammy";
import { callbackPayloads } from "../utils/callbackPayloads";
import { BookingService } from "@/services/bookingService";
import { BookingError } from "@/types/errors/BookingError";
import { PAGE_SIZE } from "@/constants/appConstants";
import dayjs from "dayjs";
import { CallbackAction } from "../constants/callbackActions";

export async function sendMyBookings(ctx: ControllerContext, page: number = 1) {
  const user = ctx.sfx.user;

  try {
    await ctx.answerCallbackQuery();
  } catch (err) {}
  
  if (!user) {
    try {
      await ctx.editMessageText("Пользователь не найден.", extraGoToHomeKeyboard);
    } catch(err) {
      await ctx.reply("Пользователь не найден.", extraGoToHomeKeyboard);
    }
    return;
  }

  const bookings = await BookingService.getByUserId(user.id);

  if (bookings.length === 0) {
    try {
      await ctx.editMessageText("У вас пока нет активных бронирований 😔", extraGoToHomeKeyboard);
    } catch(err) {
      await ctx.reply("У вас пока нет активных бронирований 😔", extraGoToHomeKeyboard);
    }
    return;
  }

  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const bookingsPage = bookings.slice(startIndex, endIndex);

  let text = `🎟️ *Ваши бронирования (стр. ${page}/${totalPages}):*\n\n`;
  const keyboard = new InlineKeyboard();

  bookingsPage.forEach((booking, index) => {
    const event = booking.bookingTickets[0]?.ticket.ticketType.event;
  
    if (event) {
      text += `*${startIndex + index + 1}.* ${event.name}\n📅 ${dayjs(event.startDate).format("DD.MM.YYYY")} | 📍 ${event.location}\n`;
  
      const ticketGroups = booking.bookingTickets.reduce((acc, bt) => {
        const type = bt.ticket.ticketType.name;
        const price = (bt.ticket.ticketType.price as unknown) as number;
        const key = `${type}_${price}`;
        if (!acc[key]) {
          acc[key] = { type, price, count: 0 };
        }
        acc[key].count++;
        return acc;
      }, {} as Record<string, { type: string; price: number; count: number }>);
  
      text += `🎟️ Билеты:\n`;
  
      for (const groupKey in ticketGroups) {
        const group = ticketGroups[groupKey];
        const totalCost = group.price * group.count;
        text += `- ${group.type} × ${group.count} — ${group.price}₽ (${totalCost}₽)\n`;
      }
  
      text += `\n`;
  
      keyboard.text(`❌ #${startIndex + index + 1}`, callbackPayloads.myBookingCancel(booking.id, page));
      keyboard.row();
    }
  });  

  if (page > 1) {
    keyboard.text("⬅️ Назад", callbackPayloads.myBookingsPage(page - 1));
  }
  if (page < totalPages) {
    keyboard.text("Вперёд ➡️", callbackPayloads.myBookingsPage(page + 1));
  }

  keyboard.row();
  keyboard.text('Главное меню', CallbackAction.GO_HOME);

  try {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  } catch(err) {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }
}

export async function sendMyBookingCancel(ctx: ControllerContext, bookingId: number, page: number) {
  const userId = ctx.from?.id.toString();
  
  if (!userId || !ctx.sfx.user?.id) {
    await ctx.reply("❗ Ошибка данных. Пожалуйста, попробуйте позже");
  }

  try {
    await BookingService.cancelBooking(bookingId);
    await ctx.answerCallbackQuery({ text: "✅ Бронь отменена." });
    await sendMyBookings(ctx, page);
  } catch(err) {
    if(err instanceof BookingError) {
      console.error(`[BookingCancel/${err.code}] ${err.message}`, err.metadata);

      await ctx.answerCallbackQuery(`❗ ${err.message}`);
    } else {
      console.error(`[BookingCancel]`, err);
      await ctx.answerCallbackQuery(`❗ Произошла ошибка, попробуйте ещё раз`);
    }
  }
}

export async function sendBookingStart(ctx: ControllerContext, eventId: number, fromPage: number, categoryId: number, subcategoryId: number) {
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
      delete bookingTimeouts[userId];
    }
  }, 120000);

  const ticketTypes = await TicketService.getTicketTypesForEvent(eventId, true);
  if (ticketTypes.length === 0) {
    await ctx.editMessageText("К сожалению, для этого мероприятия нет доступных билетов.", extraGoToHomeKeyboard);
    await ctx.answerCallbackQuery();
    return;
  }

  const keyboard = new InlineKeyboard();
  let totalAvailable: number = 0;

  ticketTypes.forEach((type) => {
    const availableCount = type.tickets.filter(t => t.status === "AVAILABLE").length;
    totalAvailable += availableCount;
    if (availableCount > 0) {
      keyboard.text(`${type.name} — ${type.price}₽ (${availableCount} шт.)`, callbackPayloads.bookingSelectType(type.id));
      keyboard.row();
    }
  });

  if(totalAvailable === 0) {
    await ctx.editMessageText("К сожалению, для этого мероприятия нет доступных билетов.", extraGoToHomeKeyboard);
    await ctx.answerCallbackQuery();
    return;
  }

  if(categoryId === 0 && subcategoryId === 0) {
    keyboard.text("⬅️ Назад к мероприятию", callbackPayloads.eventDetails(eventId, fromPage));
  } else if(categoryId !== 0) {
    keyboard.text("⬅️ Назад к мероприятию", callbackPayloads.eventDetailsCategory(eventId, fromPage, categoryId));
  } else if(subcategoryId !== 0) {
    keyboard.text("⬅️ Назад к мероприятию", callbackPayloads.eventDetailsSubcategory(eventId, fromPage, subcategoryId));
  }

  await ctx.editMessageText(
    "🎟️ Выберите тип билета:",
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );

  await ctx.answerCallbackQuery();
}

export async function sendBookingSelectType(ctx: ControllerContext, ticketTypeId: number) {
  const userId = ctx.from?.id.toString();
  
  if(!userId || !bookingSessions[userId]) {
    await ctx.answerCallbackQuery({ text: "❌ Бронирование отменено или истекло. Пожалуйста, начните заново" });
    return;
  }

  bookingSessions[userId].ticketTypeId = ticketTypeId;

  await ctx.editMessageText(
    "🎟️ Сколько билетов вы хотите забронировать?\n\nОтправьте число (например, 2) или /cancel для отмены",
    { parse_mode: "Markdown" }
  );

  await ctx.answerCallbackQuery();
}

export async function sendBookingConfirm(ctx: ControllerContext, userId: number) {
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
}

export async function sendBookingCancel(ctx: ControllerContext, userId: number) {
  if(!userId) return;

  if(bookingTimeouts[userId]) {
    clearTimeout(bookingTimeouts[userId]);
    delete bookingTimeouts[userId];
  }

  delete bookingSessions[userId];

  await ctx.answerCallbackQuery();
  await ctx.editMessageText("❌ Бронирование отменено", extraGoToHomeKeyboard);
}