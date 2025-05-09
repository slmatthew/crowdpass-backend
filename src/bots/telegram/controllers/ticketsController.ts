import { BookingService } from "@/services/bookingService";
import { BookingStatus } from "@prisma/client";
import { InlineKeyboard, InputFile } from "grammy";
import { CallbackAction } from "../constants/callbackActions";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { callbackPayloads } from "../utils/callbackPayloads";
import { ControllerContext } from "./ControllerContext";
import { TicketService } from "@/services/ticketService";
import QRCode from "qrcode";

export async function sendMyTickets(ctx: ControllerContext) {
  try {
    await ctx.answerCallbackQuery();
  } catch(err) {}

  const user = ctx.sfx.user;
  if (!user) {
    try {
      await ctx.editMessageText("Пользователь не найден.", extraGoToHomeKeyboard);
    } catch(err) {
      await ctx.reply("Пользователь не найден.", extraGoToHomeKeyboard);
    }
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
    try {
      await ctx.editMessageText("У вас пока нет активных билетов 😔", extraGoToHomeKeyboard);
    } catch(err) {
      await ctx.reply("У вас пока нет активных билетов 😔", extraGoToHomeKeyboard);
    }
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

export async function sendTicketQr(ctx: ControllerContext, ticketId: number) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  const ticket = await TicketService.getTicketById(ticketId);

  if (!ticket) {
    await ctx.answerCallbackQuery({ text: "Билет не найден." });
    return;
  }

  await ctx.editMessageText('Отправляю QR-код 👇🏻');

  if(ctx.chat) await ctx.api.sendChatAction(ctx.chat.id, 'upload_photo');

  const qrData = `${process.env.AP_BASE_URI}/validate?secret=${ticket.qrCodeSecret}`;
  const qrImageBuffer = await QRCode.toBuffer(qrData, { type: 'png' });

  await ctx.replyWithPhoto(new InputFile(qrImageBuffer), {
    caption: `🎟️ Билет на ${ticket.ticketType.event.name}\nКатегория: ${ticket.ticketType.name}`,
    ...extraGoToHomeKeyboard
  });

  await ctx.answerCallbackQuery();
}