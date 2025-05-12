import { BookingService } from "@/services/bookingService";
import { CoreController } from "./CoreController";
import { BookingStatus, User } from "@prisma/client";
import { PAGE_SIZE } from "@/constants/appConstants";
import { KeyboardBuilder } from "../ui/KeyboardBuilder";
import dayjs from "dayjs";
import { TicketService } from "@/services/ticketService";
import { ActionReply, ActionReplyPhoto, ControllerResponse } from "./types/ControllerResponse";
import QRCode from "qrcode";
import { PlatformContext, PlatformPayloads } from "./types/BotPlatformStrategy";

export class CoreTicketsController<C extends PlatformContext, P extends PlatformPayloads> extends CoreController<C, P> {
  async sendMyTickets(user: User, page: number = 1): Promise<ControllerResponse> {
    const bookings = await BookingService.getByUserId(user.id, BookingStatus.PAID);

    let tickets: {
      ticketId: number;
      eventName: string;
      eventDate: Date;
      eventLocation: string;
      ticketTypeName: string;
    }[] = [];

    for(const booking of bookings) {
      for(const bt of booking.bookingTickets) {
        const event = bt.ticket.ticketType.event;
        if(event) {
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

    if(tickets.length === 0) return this.goodActionReply({ plain: 'У вас пока нет активных билетов 😔' }, false, this.GO_HOME_KEYBOARD);

    const totalPages = Math.ceil(tickets.length / PAGE_SIZE);
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pagedTickets = tickets.slice(start, start + PAGE_SIZE);

    let mdText = `🎟️ *Ваши билеты, стр. ${currentPage}/${totalPages}*:\n\n`;
    let plText = `🎟️ Ваши билеты, стр. ${currentPage}/${totalPages}:\n\n`;

    const keyboard = new KeyboardBuilder().inline();
    let onRow = 0;

    pagedTickets.forEach((ticket, index) => {
      const mdIndex = `*${start + index + 1}.*`;
      const plIndex = `${start + index + 1}.`;
      const otherText = `${ticket.eventName} – ${ticket.ticketTypeName}\n📅 ${dayjs(ticket.eventDate).format("DD.MM.YYYY HH:mm")}\n📍 ${ticket.eventLocation}\n\n`;
    
      mdText += `${mdIndex} ${otherText}`;
      plText += `${plIndex} ${otherText}`;

      keyboard.callbackButton(`🔎 QR ${start + index + 1}`, this.strategy.callbackPayloads.ticketQr(ticket.ticketId));
      onRow++;

      if(onRow >= 2)  {
        keyboard.row();
        onRow = 0;
      }
    });

    if(onRow > 0) keyboard.row();

    if(currentPage > 1) keyboard.callbackButton('⬅️ Назад', this.strategy.callbackPayloads.myTicketsPage(currentPage - 1));
    if(currentPage < totalPages) keyboard.callbackButton('➡️ Вперёд', this.strategy.callbackPayloads.myTicketsPage(currentPage + 1));

    keyboard.row();
    keyboard.callbackButton('🏠 Главное меню', this.GO_HOME_CALLBACK);

    return this.goodActionReply({ plain: plText, markdown: mdText }, false, keyboard.build());
  }

  async sendTicketQr(user: User, ticketId: number): Promise<ControllerResponse> {
    const ticket = await TicketService.getTicketById(ticketId);

    if(!ticket) return {
      ok: false,
      action: {
        text: { plain: 'Билет не найден' },
        isNotify: true,
      } as ActionReply,
    };

    const ticketBought = await TicketService.isTicketBoughtByUser(ticket.id, user.id);
    if(!ticketBought) return {
      ok: false,
      action: {
        text: { plain: 'Вы не можете посмотреть этот QR-код' },
        isNotify: true,
      } as ActionReply,
    };

    const qrData = `${process.env.AP_BASE_URI}/validate?secret=${ticket.qrCodeSecret}`;
    const qrImageBuffer = await QRCode.toBuffer(qrData, { type: 'png' });

    const text =
      `🎟️ ${ticket.ticketType.event.name} – ${ticket.ticketType.name}\n\n` +
      `${ticket.ticketType.event.description}\n\n` +
      `Для прохода на мероприятие покажите QR-код на входе`;

    return {
      ok: true,
      action: {
        photo: qrImageBuffer,
        text: { plain: text },
        keyboard: this.GO_HOME_KEYBOARD
      } as ActionReplyPhoto,
    };
  }
}