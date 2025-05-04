import { MessageContext, KeyboardBuilder } from "vk-io";
import { bookingSessions, bookingTimeouts } from "../sessions/bookingSessions";
import { TicketService } from "@/services/ticketService";
import { BookingService } from "@/services/bookingService";
import { BookingError } from "@/types/errors/BookingError";

export async function handleBookingStart(ctx: MessageContext, eventId: number, fromPage: number) {
  const userId = ctx.state.user.id.toString();

  bookingSessions[userId] = { eventId, fromPage };

  bookingTimeouts[userId] = setTimeout(async () => {
    if (bookingSessions[userId]) {
      await ctx.send("🔔 Вы начали бронирование, но не завершили его. Пожалуйста, завершите или отмените.");
      delete bookingTimeouts[userId];
    }
  }, 120000);

  const ticketTypes = await TicketService.getTicketTypesForEvent(eventId, true);

  if (!ticketTypes.length) {
    await ctx.send("❌ Для этого мероприятия нет доступных билетов.");
    return;
  }

  const keyboard = new KeyboardBuilder();

  ticketTypes.forEach((type) => {
    const available = type.tickets.filter(t => t.status === "AVAILABLE").length;
    if (available > 0) {
      keyboard.textButton({
        label: `${type.name} — ${type.price}₽ (${available} шт.)`,
        payload: { action: `selectType_${type.id}` },
      }).row();
    }
  });

  keyboard.textButton({
    label: "⬅️ Назад",
    payload: { action: `event_${eventId}_${fromPage}` },
  }).inline();

  await ctx.send("🎟️ Выберите тип билета:", { keyboard });
}

export async function handleTicketTypeSelect(ctx: MessageContext, ticketTypeId: number) {
  const userId = ctx.state.user.id.toString();
  const session = bookingSessions[userId];

  if (!session) {
    return ctx.send("❗ Сессия бронирования не найдена. Начните заново.");
  }

  session.ticketTypeId = ticketTypeId;
  session.step = "awaiting_tickets_count";

  return ctx.send("🎟️ Сколько билетов вы хотите забронировать?\nОтправьте число (например, 2).");
}

export async function handleBookingConfirm(ctx: MessageContext, userId: string) {
  const session = bookingSessions[userId];
  const user = ctx.state.user;

  if (!session || !session.ticketTypeId || !session.ticketsCount) {
    return ctx.send("❗ Ошибка данных. Начните бронирование заново.");
  }

  try {
    const booking = await BookingService.makeBooking(user.id, session.ticketTypeId, session.ticketsCount);
    await ctx.send(`✅ Вы успешно забронировали ${session.ticketsCount} билет(а/ов)!\nНомер бронирования: ${booking.id}`);
  } catch (err) {
    if (err instanceof BookingError) {
      await ctx.send(`❗ ${err.message}`);
    } else {
      await ctx.send("❗ Произошла ошибка, попробуйте позже.");
    }
  } finally {
    clearTimeout(bookingTimeouts[userId]);
    delete bookingTimeouts[userId];
    delete bookingSessions[userId];
  }
}

export async function handleBookingCancel(ctx: MessageContext, userId: string) {
  clearTimeout(bookingTimeouts[userId]);
  delete bookingTimeouts[userId];
  delete bookingSessions[userId];

  await ctx.send("❌ Бронирование отменено.");
}
