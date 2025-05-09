import { BookingService } from "@/services/bookingService";
import { BookingStatus } from "@prisma/client";
import { InlineKeyboard, InputFile } from "grammy";
import { CallbackAction } from "../constants/callbackActions";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { callbackPayloads } from "../utils/callbackPayloads";
import { ControllerContext } from "./ControllerContext";
import { TicketService } from "@/services/ticketService";
import QRCode from "qrcode";
import { PAGE_SIZE } from "@/constants/appConstants";
import dayjs from "dayjs";

export async function sendMyTickets(ctx: ControllerContext, page: number = 1) {
  try { await ctx.answerCallbackQuery(); } catch(err) {}

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

  const totalPages = Math.ceil(tickets.length / PAGE_SIZE);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pagedTickets = tickets.slice(start, start + PAGE_SIZE);

  let text = `🎟️ *Ваши билеты, стр. ${currentPage}/${totalPages}:*\n\n`;
  const keyboard = new InlineKeyboard();
  let onRow = 0;

  pagedTickets.forEach((ticket, index) => {
    text += `*${start + index + 1}.* ${ticket.eventName}\n📅 ${dayjs(ticket.eventDate).format("DD.MM.YYYY HH:mm")}\n📍 ${ticket.eventLocation}\nКатегория: ${ticket.ticketTypeName}\n\n`;
    keyboard.text(`🔎 QR ${start + index + 1}`, callbackPayloads.ticketQr(ticket.ticketId));
    onRow++;

    if(onRow >= 2) {
      keyboard.row();
      onRow = 0;
    }
  });

  if(onRow > 0) keyboard.row();

  if(currentPage > 1) {
    keyboard.text("⬅️ Назад", callbackPayloads.myTicketsPage(currentPage - 1));
  }
  if(currentPage < totalPages) {
    keyboard.text("➡️ Вперёд", callbackPayloads.myTicketsPage(currentPage + 1));
  }

  keyboard.row().text('🏠 Главное меню', CallbackAction.GO_HOME);

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

  const text =
    `🎟️ ${ticket.ticketType.event.name} – ${ticket.ticketType.name}\n\n` +
    `${ticket.ticketType.event.description}\n\n` +
    `Для прохода на мероприятие покажите QR-код на входе`;

  await ctx.replyWithPhoto(new InputFile(qrImageBuffer), {
    caption: text,
    ...extraGoToHomeKeyboard
  });

  await ctx.answerCallbackQuery();
}