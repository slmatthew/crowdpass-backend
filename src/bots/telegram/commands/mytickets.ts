import { CommandContext, InlineKeyboard } from "grammy";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { BookingService } from "@/services/bookingService";
import { SharedContext } from "@/types/grammy/SessionData";
import { BookingStatus } from "@prisma/client";
import { callbackPayloads } from "../utils/callbackPayloads";
import { CallbackAction } from "../constants/callbackActions";

export const myticketsCommand = async (ctx: CommandContext<SharedContext>) => {
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
    await ctx.reply("У вас пока нет активных билетов 😔", extraGoToHomeKeyboard
    );
    return;
  }

  let text = `🎟️ *Ваши билеты:*\n\n`;
  const keyboard = new InlineKeyboard();

  tickets.forEach((ticket, index) => {
    text += `*${index + 1}.* ${ticket.eventName}\n📅 ${ticket.eventDate.toLocaleDateString()} | 📍 ${ticket.eventLocation}\nКатегория: ${ticket.ticketTypeName}\n\n`;
    keyboard.text(`🔎 QR ${index + 1}`, callbackPayloads.ticketQr(ticket.ticketId));
    keyboard.row();
  });

  keyboard.text('⬅️ Главное меню', CallbackAction.GO_HOME);

  await ctx.reply(text, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
};