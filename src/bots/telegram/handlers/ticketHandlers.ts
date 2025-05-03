import { Api, Bot, InlineKeyboard, InputFile, RawApi } from "grammy";
import { sendEventsPage } from "../utils/paginator";
import QRCode from "qrcode";
import { SharedContext } from "@/types/grammy/SessionData";
import { EventService } from "@/services/eventService";
import { TicketService } from "@/services/ticketService";

export function handleTicketCallbacks(bot: Bot<SharedContext, Api<RawApi>>) {
  bot.callbackQuery(/^back_to_events_(\d+)$/, async (ctx) => {
    const page = Number(ctx.match[1]);
    await ctx.answerCallbackQuery();
    await sendEventsPage(ctx, page, true);
  });

  bot.callbackQuery(/^event_(\d+)_(\d+)$/, async (ctx) => {
    const eventId = Number(ctx.match[1]);
    const fromPage = Number(ctx.match[2]);
  
    const event = await EventService.getEventById(eventId);
  
    if (!event) {
      await ctx.answerCallbackQuery({ text: "Мероприятие не найдено!" });
      return;
    }
  
    const keyboard = new InlineKeyboard()
      .text("🎟️ Забронировать билет", `book_${eventId}_${fromPage}`)
      .row()
      .text("⬅️ Назад", `back_to_events_${fromPage}`);
  
    await ctx.editMessageText(
      `🎫 *${event.name}*\n\n${event.description}\n\n📅 Дата: ${event.startDate.toLocaleString()}\n📍 Место: ${event.location}`,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^page_(\d+)$/, async (ctx) => {
    const page = Number(ctx.match[1]);
    await ctx.answerCallbackQuery();
    await sendEventsPage(ctx, page, true);
  });

  bot.callbackQuery(/^show_qr_(\d+)$/, async (ctx) => {
    const ticketId = Number(ctx.match[1]);
    const userId = ctx.from?.id.toString();
    if (!userId) return;
  
    const ticket = await TicketService.getTicketById(ticketId);
  
    if (!ticket) {
      await ctx.answerCallbackQuery({ text: "Билет не найден." });
      return;
    }
  
    const qrData = `${process.env.AP_BASE_URI}/validate?secret=${ticket.qrCodeSecret}`;
    const qrImageBuffer = await QRCode.toBuffer(qrData, { type: 'png' });
  
    await ctx.replyWithPhoto(new InputFile(qrImageBuffer), {
      caption: `🎟️ Билет на ${ticket.ticketType.event.name}\nКатегория: ${ticket.ticketType.name}`,
    });
  
    await ctx.answerCallbackQuery();
  });

  
}