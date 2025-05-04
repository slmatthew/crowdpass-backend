import { MessageContext, KeyboardBuilder } from "vk-io";
import { BookingService } from "@/services/bookingService";
import { PAGE_SIZE } from "@/constants/appConstants";

export async function sendBookingsPage(ctx: MessageContext, page: number) {
  const user = ctx.state.user;
  if (!user) return ctx.send("Пользователь не найден.");

  const bookings = await BookingService.getByUserId(user.id);
  if (!bookings.length) {
    return ctx.send("У вас пока нет активных бронирований 😔");
  }

  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const bookingsPage = bookings.slice(startIndex, startIndex + PAGE_SIZE);

  let text = `🎟️ Ваши бронирования (стр. ${page}/${totalPages}):\n\n`;
  const keyboard = new KeyboardBuilder();

  bookingsPage.forEach((booking, index) => {
    const event = booking.bookingTickets[0]?.ticket.ticketType.event;
    if (!event) return;

    text += `*${startIndex + index + 1}.* ${event.name}\n📅 ${new Date(event.startDate).toLocaleDateString()} | 📍 ${event.location}\n`;

    const groups = booking.bookingTickets.reduce((acc, bt) => {
      const t = bt.ticket.ticketType;
      const key = `${t.name}_${t.price}`;
      if (!acc[key]) acc[key] = { type: t.name, price: Number(t.price), count: 0 };
      acc[key].count++;
      return acc;
    }, {} as Record<string, { type: string; price: number; count: number }>);

    text += `🎟️ Билеты:\n`;
    Object.values(groups).forEach(g => {
      text += `- ${g.type} × ${g.count} — ${g.price}₽ (${g.price * g.count}₽)\n`;
    });

    text += `\n`;

    keyboard.textButton({
      label: `❌ Отменить ${startIndex + index + 1}`,
      payload: { action: `cancel_${booking.id}_${page}` },
    }).row();
  });

  if (page > 1) {
    keyboard.textButton({
      label: "⬅️ Назад",
      payload: { action: `mybookings_page_${page - 1}` },
    });
  }

  if (page < totalPages) {
    keyboard.textButton({
      label: "Вперёд ➡️",
      payload: { action: `mybookings_page_${page + 1}` },
    });
  }

  keyboard.row().textButton({
    label: "🏠 Главное меню",
    payload: { action: "go_to_home" },
  }).inline();

  await ctx.send(text, { keyboard });
}
