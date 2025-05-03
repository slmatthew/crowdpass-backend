import { CommandContext, Context, InlineKeyboard } from "grammy";
import { prisma } from "../../../db/prisma";
import { extraGoToHomeKeyboard } from "../markups/extraGoToHomeKeyboard";

export const myticketsCommand = async (ctx: CommandContext<Context>) => {
  const telegramUserId = ctx.from?.id.toString();
  if (!telegramUserId) return;

  const user = await prisma.user.findUnique({
    where: { telegramId: telegramUserId },
  });

  if (!user) {
    await ctx.reply("Пользователь не найден.", extraGoToHomeKeyboard);
    return;
  }

  const bookings = await prisma.booking.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
    include: {
      bookingTickets: {
        include: {
          ticket: {
            include: {
              ticketType: {
                include: {
                  event: true,
                },
              },
            },
          },
        },
      },
    },
  });

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
    keyboard.text(`🔎 QR ${index + 1}`, `show_qr_${ticket.ticketId}`);
    keyboard.row();
  });

  keyboard.text('⬅️ Главное меню', 'go_to_home');

  await ctx.reply(text, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
};