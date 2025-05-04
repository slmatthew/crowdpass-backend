import { MessageContext, KeyboardBuilder } from "vk-io";
import { EventService } from "@/services/eventService";
import { TicketService } from "@/services/ticketService";
import { sendEventsPage } from "../commands/events";
import QRCode from "qrcode";

export async function handlePagination(ctx: MessageContext, page: number) {
  await sendEventsPage(ctx, page);
}

export async function handleEventDetails(ctx: MessageContext, eventId: number, fromPage: number) {
  const event = await EventService.getEventById(eventId);

  if (!event) {
    return ctx.send("❌ Мероприятие не найдено.");
  }

  const keyboard = new KeyboardBuilder()
    .textButton({
      label: "🎟️ Забронировать билет",
      payload: { action: `book_${eventId}_${fromPage}` },
    })
    .row()
    .textButton({
      label: "⬅️ Назад",
      payload: { action: `page_${fromPage}` },
    })
    .inline();

  const date = new Date(event.startDate).toLocaleString();

  await ctx.send(
    `🎫 ${event.name}\n\n${event.description}\n\n📅 Дата: ${date}\n📍 Место: ${event.location}`,
    { keyboard }
  );
}

export async function handleShowQr(ctx: MessageContext, ticketId: number) {
  const userId = ctx.state.user?.id;
  if (!userId) return;

  const ticket = await TicketService.getTicketById(ticketId);
  if (!ticket) {
    return ctx.send("❌ Билет не найден.");
  }

  const qrData = `${process.env.AP_BASE_URI}/validate?secret=${ticket.qrCodeSecret}`;
  const qrImageBuffer = await QRCode.toBuffer(qrData, { type: "png" });

  await ctx.sendPhotos([
    {
      value: qrImageBuffer,
      filename: `ticket_${ticketId}.png`,
    },
  ], {
    message: `🎟️ Билет на ${ticket.ticketType.event.name}\nКатегория: ${ticket.ticketType.name}`,
  });
}