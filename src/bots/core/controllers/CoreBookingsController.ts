import { BookingService } from "@/services/bookingService";
import { CoreController } from "./CoreController";
import { ActionReply, ControllerResponse } from "./types/ControllerResponse";
import { User } from "@prisma/client";
import { PAGE_SIZE } from "@/constants/appConstants";
import { KeyboardBuilder } from "../ui/KeyboardBuilder";
import dayjs from "dayjs";
import { BookingError } from "@/types/errors/BookingError";
import { bookingSessionService } from "@/bots/core/services/BookingSessionService";
import { TicketService } from "@/services/ticketService";

export class CoreBookingController extends CoreController {
  async sendMyBookings(user: User, page: number = 1): Promise<ControllerResponse> {
    const bookings = await BookingService.getByUserId(user.id);

    if(bookings.length === 0) {
      return this.badResult("У вас пока нет активных бронирований 😔");
    }

    const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const bookingsPage = bookings.slice(startIndex, endIndex);

    let markdown = `🎟️ *Ваши бронирования (стр. ${page}/${totalPages}):*\n\n`;
    let plain = `🎟️ Ваши бронирования (стр. ${page}/${totalPages}):\n\n`;

    const keyboard = new KeyboardBuilder();

    bookingsPage.forEach((booking, index) => {
      const event = booking.bookingTickets[0]?.ticket.ticketType.event;

      if(event) {
        markdown += `*${startIndex + index + 1}.* ${event.name}\n📅 ${dayjs(event.startDate).format("DD.MM.YYYY")} | 📍 ${event.location}\n`;
        plain += `${startIndex + index + 1}. ${event.name}\n📅 ${dayjs(event.startDate).format("DD.MM.YYYY")} | 📍 ${event.location}\n`;

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

        markdown += `🎟️ Билеты:\n`;
        plain += `🎟️ Билеты:\n`;

        for (const groupKey in ticketGroups) {
          const group = ticketGroups[groupKey];
          const totalCost = group.price * group.count;
          markdown += `- ${group.type} × ${group.count} — ${group.price}₽ (${totalCost}₽)\n`;
          plain += `- ${group.type} × ${group.count} — ${group.price}₽ (${totalCost}₽)\n`;
        }

        markdown += `\n`;
        plain += `\n`;

        keyboard.callbackButton(`💸 #${startIndex + index + 1}`, this.strategy.callbackPayloads.myBookingPay(booking.id, page));
        keyboard.callbackButton(`❌ #${startIndex + index + 1}`, this.strategy.callbackPayloads.myBookingCancel(booking.id, page));
        keyboard.row();
      }
    });

    if(page > 1) keyboard.callbackButton("⬅️ Назад", this.strategy.callbackPayloads.myBookingsPage(page - 1));
    if(page < totalPages) keyboard.callbackButton("Вперёд ➡️", this.strategy.callbackPayloads.myBookingsPage(page + 1));
  
    keyboard.row();
    keyboard.callbackButton('Главное меню', this.GO_HOME_CALLBACK);

    return {
      ok: true,
      action: {
        text: { plain, markdown },
        keyboard: keyboard.build()
      }
    };
  }

  async sendMyBookingCancel(user: User, bookingId: number, page: number) {
    try {
      const booking = await BookingService.getById(bookingId);
      if(!booking) return this.badResult("Неверный идентификатор бронирования");
      if(booking.userId !== user.id) return this.badResult("Вы не можете отменить это бронирование");

      await BookingService.cancelBooking(bookingId);
      
      return {
        ok: true,
        action: {
          text: { plain:  "✅ Бронь отменена." },
          isNotify: true,
        } as ActionReply,
      };
    } catch(err) {
      const result = {
        ok: false,
        action: {
          text: { plain: '' },
        } as ActionReply
      };

      if(err instanceof BookingError) {
        console.error(`[BookingCancel/${err.code}] ${err.message}`, err.metadata);
  
        result.action.text.plain = `❗ ${err.message}`;
      } else {
        console.error(`[BookingCancel]`, err);
        result.action.text.plain = `❗ Произошла ошибка, попробуйте ещё раз`;
      }

      return result;
    }
  }

  async sendBookingStart(user: User, eventId: number, fromPage: number, categoryId: number, subcategoryId: number) {
    let backButtonPayload: string | { action: string } = this.GO_HOME_CALLBACK;
    if(categoryId === 0 && subcategoryId === 0) {
      backButtonPayload = this.strategy.callbackPayloads.eventDetails(eventId, fromPage);
    } else if(categoryId !== 0) {
      backButtonPayload = this.strategy.callbackPayloads.eventDetailsCategory(eventId, fromPage, categoryId);
    } else if(subcategoryId !== 0) {
      backButtonPayload = this.strategy.callbackPayloads.eventDetailsSubcategory(eventId, fromPage, subcategoryId);
    }
  
    bookingSessionService.setSession(user.id, { step: 'start', eventId, fromPage });
  
    bookingSessionService.setTimeout(user.id, setTimeout(async () => {
      if(bookingSessionService.getSession(user.id)) {
        bookingSessionService.deleteSession(user.id);
      }
    }, 120000));
  
    const ticketTypes = await TicketService.getTicketTypesForEvent(eventId, true);
    if(ticketTypes.length === 0) {
      return {
        ok: true,
        action: {
          text: { plain: "К сожалению, для этого мероприятия нет доступных билетов." },
          keyboard: new KeyboardBuilder().inline().callbackButton('Вернуться назад', backButtonPayload).build(),
        }
      };
    }
  
    const keyboard = new KeyboardBuilder();
    let totalAvailable: number = 0;
  
    ticketTypes.forEach((type) => {
      const availableCount = type.tickets.filter(t => t.status === "AVAILABLE").length;
      totalAvailable += availableCount;
      if (availableCount > 0) {
        keyboard.callbackButton(`${type.name} — ${type.price}₽ (${availableCount} шт.)`, this.strategy.callbackPayloads.bookingSelectType(type.id));
        keyboard.row();
      }
    });
  
    if(totalAvailable === 0) {
      return {
        ok: true,
        action: {
          text: { plain: "К сожалению, для этого мероприятия нет доступных билетов." },
          keyboard: new KeyboardBuilder().inline().callbackButton('Вернуться назад', backButtonPayload).build(),
        }
      };
    }
  
    keyboard.callbackButton("⬅️ Назад к мероприятию", backButtonPayload);
  
    return {
      ok: true,
      action: {
        text: { plain: "🎟️ Выберите тип билета:" },
        keyboard: keyboard.build(),
      }
    };
  }
  
  async sendBookingSelectType(user: User, ticketTypeId: number) {
    const session = bookingSessionService.getSession(user.id);
    if(!session || session.step !== 'start') {
      if(session) bookingSessionService.deleteSession(user.id);
      return {
        ok: false,
        action: {
          text: { plain: "❌ Бронирование отменено или истекло. Пожалуйста, начните заново" },
          isNotify: true,
        } as ActionReply,
      };
    }
  
    bookingSessionService.setSession(user.id, { ...session, step: 'ask_count', ticketTypeId });
  
    return {
      ok: true,
      action: {
        text: { plain: "🎟️ Сколько билетов вы хотите забронировать?\n\nОтправьте число (например, 2) или /cancel для отмены" },
      } as ActionReply,
    };
  }
  
  async sendBookingConfirm(user: User, userId: number) {
    const session = bookingSessionService.getSession(user.id);
    if(!session || !userId || user.id !== userId) {
      return {
        ok: false,
        action: {
          text: { plain: "⚠️ Бронирование не найдено или уже отменено." },
          isNotify: true,
        } as ActionReply,
      };
    }
  
    if (!session.ticketTypeId || !session.ticketsCount || session.step !== 'end') {
      bookingSessionService.deleteSession(user.id);
      return {
        ok: false,
        action: {
          text: { plain: "❗ Ошибка данных. Пожалуйста, начните бронирование заново." },
        } as ActionReply,
      };
    }
  
    try {
      const booking = await BookingService.makeBooking(user.id, session.ticketTypeId, session.ticketsCount);

      return this.goodActionReply(
        { plain: `✅ Вы успешно забронировали ${session.ticketsCount} билет(а/ов)!\n\nНомер бронирования: ${booking.id}` },
        false,
        new KeyboardBuilder().inline().callbackButton('🎟️ Мои бронирования', this.strategy.callbackPayloads.myBookingsPage(1)).build(),
      );
    } catch(err) {
      if(err instanceof BookingError) {
        console.error(`[BookingMake/${err.code}] ${err.message}`, err.metadata);

        return this.badResult(`❗ ${err.message}`, undefined, true);
      } else {
        console.error(`[BookingMake]`, err);
        return this.badResult(`❗ Произошла ошибка, попробуйте ещё раз`, undefined, true);
      }
    } finally {
      bookingSessionService.deleteSession(user.id);
    }
  }
  
  async sendBookingCancel(user: User, userId: number) {
    if(!userId || user.id !== userId) return this.badResult("❗ Ошибка данных. Пожалуйста, начните бронирование заново.");
  
    bookingSessionService.deleteSession(user.id);
  
    return this.goodActionReply({ plain: "❌ Бронирование отменено" }, false, this.GO_HOME_KEYBOARD);
  }
}