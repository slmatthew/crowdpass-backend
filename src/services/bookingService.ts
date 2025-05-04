import { prisma } from "../db/prisma";
import { Booking, BookingStatus, TicketStatus } from "@prisma/client";
import { BookingError, BookingErrorCodes } from "../types/errors/BookingError";
import { TicketService } from "./ticketService";
import { EventService } from "./eventService";

interface BookingQueryParams {
  status?: BookingStatus;
  userId?: number;
  eventId?: number;
  page?: number;
  limit?: number;
}

export class BookingService {
  /**
   * Удалять ли билеты при отмене бронирования
   * Если true, то билеты будут удалены из базы данных
   * Если false, то билеты будут возвращены в статус AVAILABLE
   */
  static SHOULD_DELETE_TICKETS = false;

  static async getAll({
    status,
    userId,
    eventId,
    page = 1,
    limit = 20,
  }: BookingQueryParams) {
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (eventId) {
      where.bookingTickets = {
        some: {
          ticket: {
            ticketType: {
              eventId,
            },
          },
        },
      };
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: true,
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
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total };
  }

  static async getById(id: number) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        bookingTickets: {
          include: {
            ticket: {
              include: {
                ticketType: {
                  include: { event: true },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Получить все бронирования пользователя
   * Используется в команде mybookings в ботах
   */
  static async getByUserId(userId: number, status: BookingStatus = BookingStatus.ACTIVE) {
    return prisma.booking.findMany({
      where: { userId, status },
      include: {
        bookingTickets: {
          include: {
            ticket: {
              include: {
                ticketType: {
                  include: { event: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async canUserManageBooking(userId: number, bookingId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });
    if(!booking) throw new BookingError(BookingErrorCodes.INVALID_BOOKING_ID, "Бронирование не найдено");

    const bookingTicket = await prisma.bookingTicket.findFirst({
      where: { bookingId: booking.id },
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
    });
    if(!bookingTicket) throw new BookingError(BookingErrorCodes.BOOKING_TICKETS_NOT_FOUND, "Не найдены билеты в бронировании");

    return EventService.canUserManageEvent(userId, bookingTicket.ticket.ticketType.eventId);
  }

  static async updateStatus(id: number, status: BookingStatus, allowStatusChange: boolean = false) {
    const booking = await BookingService.getById(id);
    if(!booking) throw new BookingError(BookingErrorCodes.INVALID_BOOKING_ID, "Бронирование не найдено");

    if(booking.status === status) return true;

    if(!allowStatusChange) {
      if(booking.status === BookingStatus.PAID || booking.status === BookingStatus.CANCELLED) throw new BookingError(BookingErrorCodes.INVALID_BOOKING_STATUS, "Бронирование уже оплачено или отменено", booking.status);

      if(status === BookingStatus.PAID) return BookingService.payBooking(id);
      if(status === BookingStatus.CANCELLED) return BookingService.cancelBooking(id);

      return true;
    }

    const tickets = await prisma.bookingTicket.findMany({
      where: { bookingId: id },
      include: { ticket: true },
    });

    if(tickets.length === 0) {
      await BookingService.cancelBooking(id);

      throw new BookingError(BookingErrorCodes.BOOKING_TICKETS_NOT_FOUND, "Не найдены билеты в бронировании, новый статус – отмена", { oldStatus: booking.status, newStatus: BookingStatus.CANCELLED });
    }

    switch(status) {
      case BookingStatus.ACTIVE:
        const actualTickets = await prisma.ticket.findMany({
          where: {
            id: { in: tickets.map(t => t.ticketId) },
          },
        });

        if(booking.status === BookingStatus.CANCELLED) {
          const actualTicketsStatuses = actualTickets.map(t => t.status);

          if(
            actualTicketsStatuses.includes(TicketStatus.SOLD) ||
            actualTicketsStatuses.includes(TicketStatus.RESERVED) ||
            actualTicketsStatuses.includes(TicketStatus.USED)
          ) {
            const availableTickets = await TicketService.getAvailableTickets(tickets[0].ticket.ticketTypeId);
            if(availableTickets.length < tickets.length) {
              throw new BookingError(BookingErrorCodes.TOO_MUCH_TICKETS, "Недостаточно доступных билетов", availableTickets.length);
            }

            await prisma.bookingTicket.deleteMany({
              where: { bookingId: booking.id }
            });

            await prisma.bookingTicket.createMany({
              data: availableTickets.map(t => {
                return { bookingId: booking.id, ticketId: t.id };
              })
            });

            await TicketService.updateStatusMany(
              availableTickets.map(t => t.id),
              TicketStatus.RESERVED
            );
          } else {
            await TicketService.updateStatusMany(
              actualTickets.map(t => t.id),
              TicketStatus.RESERVED
            );
          }

          await prisma.booking.update({
            where: { id },
            data: { status },
          });
        } else {
          // booking.status = PAID
          await TicketService.updateStatusMany(
            actualTickets.map(t => t.id),
            TicketStatus.RESERVED
          );
        }
        return true;

      case BookingStatus.PAID:
        return BookingService.payBooking(id, true);

      case BookingStatus.CANCELLED:
        return BookingService.cancelBooking(id, true);
    }
  }

  /**
   * Бронирование билетов
   */
  static async makeBooking(userId: number, ticketTypeId: number, quantity: number) {
    if(quantity <= 0) throw new BookingError(BookingErrorCodes.INVALID_QUANTITY, "Количество билетов должно быть больше 0");

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if(!user) throw new BookingError(BookingErrorCodes.USER_NOT_FOUND, "Пользователь не найден");

    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
    });
    if(!ticketType) throw new BookingError(BookingErrorCodes.TICKET_TYPE_NOT_FOUND, "Тип билета не найден");

    const availableTickets = await prisma.ticket.findMany({
      where: {
        ticketTypeId: ticketType.id,
        status: TicketStatus.AVAILABLE,
      },
      take: quantity,
    });
    if(availableTickets.length < quantity) {
      throw new BookingError(BookingErrorCodes.TOO_MUCH_TICKETS, "Недостаточно доступных билетов", availableTickets.length);
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        status: BookingStatus.ACTIVE,
        bookingTickets: {
          create: availableTickets.map(ticket => ({
            ticketId: ticket.id,
          })),
        },
      },
    });

    await TicketService.updateStatusMany(
      availableTickets.map(t => t.id),
      TicketStatus.RESERVED
    );

    return booking;
  }

  /**
   * Оплатить бронь
   */
  static async payBooking(bookingId: number, byPassStatusCheck: boolean = false) {
    if(!bookingId) throw new BookingError(BookingErrorCodes.INVALID_BOOKING_ID, "ID бронирования не указан");

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingTickets: true,
      },
    });
    if(!booking) throw new BookingError(BookingErrorCodes.INVALID_BOOKING_ID, "Бронирование не найдено");
    if(booking.status !== BookingStatus.ACTIVE && !byPassStatusCheck) throw new BookingError(BookingErrorCodes.INVALID_BOOKING_STATUS, "Бронирование невозможно оплатить", booking.status);

    await TicketService.updateStatusMany(
      booking.bookingTickets.map(t => t.ticketId),
      TicketStatus.SOLD
    );

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.PAID },
    });

    return true;
  }

  /**
   * Отмена бронирования
   */
  static async cancelBooking(bookingId: number, byPassStatusCheck: boolean = false, deleteTickets: boolean = BookingService.SHOULD_DELETE_TICKETS) {
    if(!bookingId) throw new BookingError(BookingErrorCodes.INVALID_BOOKING_ID, "ID бронирования не указан");

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingTickets: true,
      },
    });
    if(!booking) throw new BookingError(BookingErrorCodes.INVALID_BOOKING_ID, "Бронирование не найдено");
    if(booking.status !== BookingStatus.ACTIVE && !byPassStatusCheck) throw new BookingError(BookingErrorCodes.INVALID_BOOKING_STATUS, "Бронирование невозможно отменить", booking.status);

    await TicketService.updateStatusMany(
      booking.bookingTickets.map(t => t.ticketId),
      TicketStatus.AVAILABLE
    );

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    if(deleteTickets) {
      await prisma.bookingTicket.deleteMany({
        where: {
          bookingId,
        },
      });
    }

    return true;
  }
}