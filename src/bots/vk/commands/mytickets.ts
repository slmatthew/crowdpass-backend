import { MessageContext, KeyboardBuilder } from "vk-io";
import { BookingService } from "@/services/bookingService";
import { BookingStatus } from "@prisma/client";

export async function sendTicketsPage(ctx: MessageContext) {
  const user = ctx.state.user;
  if (!user) return ctx.send("Пользователь не найден.");

  const bookings = await BookingService.getByUserId(user.id, BookingStatus.PAID);
  const tickets = [];

  for (const booking of bookings) {
    for (const bt of booking.bookingTickets) {
      const ticket = bt.ticket;
      const event = ticket.ticketType.event;
      if (event) {
        tickets.push({
          id: ticket.id,
          eventName: event.name,
          date: event.startDate,
          location: event.location,
          type: ticket.ticketType.name,
        });
      }
    }
  }

  if (!tickets.length) {
    return ctx.send("У вас пока нет активных билетов 😔");
  }

  let text = `🎫 Ваши билеты:\n\n`;
  const keyboard = new KeyboardBuilder();

  tickets.forEach((t, i) => {
    text += `*${i + 1}.* ${t.eventName}\n📅 ${new Date(t.date).toLocaleDateString()} | 📍 ${t.location}\nКатегория: ${t.type}\n\n`;
    keyboard.textButton({
      label: `🔎 QR ${i + 1}`,
      payload: { action: `show_qr_${t.id}` },
    }).row();
  });

  keyboard.textButton({
    label: "🏠 Главное меню",
    payload: { action: "go_to_home" },
  }).inline();

  await ctx.send(text, { keyboard });
}
