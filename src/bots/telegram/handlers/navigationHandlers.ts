import { Api, Bot, Context, InlineKeyboard, RawApi } from "grammy";
import { prisma } from "../../../db/prisma";
import { sendBookingsPage, sendEventsPage } from "../utils/paginator";
import { extraGoToHomeKeyboard } from "../markups/extraGoToHomeKeyboard";
import { SharedContext } from "@/types/grammy/SessionData";

export function handleNavigationCallbacks(bot: Bot<SharedContext, Api<RawApi>>) {
  bot.callbackQuery("go_to_home", async (ctx) => {
    await ctx.answerCallbackQuery();
  
    const keyboard = new InlineKeyboard()
      .text("📜 Список мероприятий", "go_to_events")
      .row()
      .text("🎟️ Мои бронирования", "go_to_bookings")
      .row()
      .text("🎫 Мои билеты", "go_to_tickets");
  
    await ctx.editMessageText(
      `👋 Добро пожаловать в *CrowdPass*!
  
  Выберите действие ниже 👇`,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  });

  bot.callbackQuery("go_to_events", async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendEventsPage(ctx, 1);
  });
  
  bot.callbackQuery("go_to_bookings", async (ctx) => {
    await ctx.answerCallbackQuery();
    
    const telegramUserId = ctx.from?.id.toString();
    if (!telegramUserId) return;
  
    await sendBookingsPage(ctx, telegramUserId, 1);
  });
  
  bot.callbackQuery("go_to_tickets", async (ctx) => {
    await ctx.answerCallbackQuery();
  
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
      await ctx.reply("У вас пока нет активных билетов 😔", extraGoToHomeKeyboard);
      return;
    }
  
    let text = `🎟️ *Ваши билеты:*\n\n`;
    const keyboard = new InlineKeyboard();
  
    tickets.forEach((ticket, index) => {
      text += `*${index + 1}.* ${ticket.eventName}\n📅 ${ticket.eventDate.toLocaleDateString()} | 📍 ${ticket.eventLocation}\nКатегория: ${ticket.ticketTypeName}\n\n`;
      keyboard.text(`🔎 QR ${index + 1}`, `show_qr_${ticket.ticketId}`);
      keyboard.row();
    });
  
    keyboard.row();
    keyboard.text('Главное меню', 'go_to_home');
  
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  });
}