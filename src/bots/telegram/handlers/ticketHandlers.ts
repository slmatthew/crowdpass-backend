import { Api, Bot, InlineKeyboard, InputFile, RawApi } from "grammy";
import { sendEventsPage } from "../utils/paginator";
import QRCode from "qrcode";
import { SharedContext } from "@/types/grammy/SessionData";
import { EventService } from "@/services/eventService";
import { TicketService } from "@/services/ticketService";
import { extraGoToHomeKeyboard } from "../markups/extraGoToHomeKeyboard";
import { CallbackAction } from "../constants/callbackActions";
import { callbackPayloads } from "../utils/callbackPayloads";
import { handlePayload } from "../utils/handlePayload";
import dayjs from "dayjs";

export function handleTicketCallbacks(bot: Bot<SharedContext, Api<RawApi>>) {
  handlePayload<[number]>(bot, CallbackAction.TICKET_QR, async (ctx, ticketId) => {
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
  });

  
}