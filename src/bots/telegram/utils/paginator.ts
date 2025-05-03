import { CallbackQueryContext, CommandContext, Context, InlineKeyboard } from "grammy";
import { extraGoToHomeKeyboard } from "../markups/extraGoToHomeKeyboard";
import { PAGE_SIZE } from "../../../constants/appConstants";
import { prisma } from "../../../db/prisma";

export async function sendBookingsPage(ctx: CommandContext<Context>|CallbackQueryContext<Context>, userId: string, page: number, isEdit = false) {
  const user = await prisma.user.findUnique({
    where: { telegramId: userId },
  });

  if (!user) {
    if (isEdit) {
      await ctx.editMessageText("Пользователь не найден.", extraGoToHomeKeyboard);
    } else {
      await ctx.reply("Пользователь не найден.", extraGoToHomeKeyboard);
    }
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
    orderBy: {
      createdAt: "desc",
    },
  });

  if (bookings.length === 0) {
    if (isEdit) {
      await ctx.editMessageText("У вас пока нет активных бронирований 😔", extraGoToHomeKeyboard);
    } else {
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
      text += `*${startIndex + index + 1}.* ${event.name}\n📅 ${event.startDate.toLocaleDateString()} | 📍 ${event.location}\n`;
  
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
  
      keyboard.text(`❌ Отменить ${startIndex + index + 1}`, `cancel_${booking.id}_${page}`);
      keyboard.row();
    }
  });  

  if (page > 1) {
    keyboard.text("⬅️ Назад", `mybookings_page_${page - 1}`);
  }
  if (page < totalPages) {
    keyboard.text("Вперёд ➡️", `mybookings_page_${page + 1}`);
  }

  keyboard.row();
  keyboard.text('Главное меню', 'go_to_home');

  if (isEdit) {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }
}

export async function sendEventsPage(ctx: CommandContext<Context>|CallbackQueryContext<Context>, page: number, isEdit = false) {
  const events = await prisma.event.findMany({
    orderBy: { startDate: "asc" },
  });

  if (events.length === 0) {
    const message = "Пока нет доступных мероприятий 😔";
    if (isEdit) {
      await ctx.editMessageText(message, extraGoToHomeKeyboard);
    } else {
      await ctx.reply(message, extraGoToHomeKeyboard);
    }
    return;
  }

  const totalPages = Math.ceil(events.length / PAGE_SIZE);

  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const eventsPage = events.slice(startIndex, endIndex);

  let text = `🎟️ *Мероприятия (стр. ${page}/${totalPages}):*\n\n`;

  const keyboard = new InlineKeyboard();

  eventsPage.forEach((event, index) => {
    const eventNumber = startIndex + index + 1;
    text += `${eventNumber}. ${event.name} (${event.startDate.toLocaleDateString()})\n`;
    keyboard.text(`${eventNumber}`, `event_${event.id}_${page}`);
  });    

  keyboard.row();

  if (page > 1) {
    keyboard.text("⬅️ Назад", `page_${page - 1}`);
  }
  if (page < totalPages) {
    keyboard.text("Вперёд ➡️", `page_${page + 1}`);
  }

  keyboard.row();
  keyboard.text('Главное меню', 'go_to_home');

  if (isEdit) {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }
}