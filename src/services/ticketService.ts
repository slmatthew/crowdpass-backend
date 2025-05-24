import { prisma } from "../db/prisma";
import { Booking, Event, Ticket, TicketStatus, TicketType } from "@prisma/client";
import { randomBytes } from "crypto";
import { BookingService } from "./bookingService";
import { BookingError, BookingErrorCodes } from "../types/errors/BookingError";
import { ActionLogAction } from "@/constants/appConstants";

interface TicketExtended extends Ticket {
  ticketType?: TicketType & {
    event: Event;
  };
}

export class TicketService {
  static generateSecret(): string {
    return randomBytes(16).toString('hex');
  }

  static async getTicketById(ticketId: number): Promise<TicketExtended | null> {
    return prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        ticketType: {
          include: {
            event: true,
          },
        },
      },
    });
  }

  static async isTicketBoughtByUser(ticketId: number, userId: number): Promise<boolean> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        bookingTickets: {
          where: {
            booking: {
              status: 'PAID',
              userId
            }
          }
        }
      }
    });

    if(!ticket || !ticket.bookingTickets) return false;

    return ticket.bookingTickets.length > 0;
  }

  static async updateStatus(ticketId: number, status: TicketStatus) {
    const ticket = await TicketService.getTicketById(ticketId);
    if(!ticket) return;

    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        qrCodeSecret: ticket.qrCodeSecret ?? TicketService.generateSecret(),
      },
    });
  }

  static async updateStatusMany(ticketIds: number[], status: TicketStatus) {
    for (let i = 0; i < ticketIds.length; i += 100) {
      const batchIds = ticketIds.slice(i, i + 100);

      await prisma.$transaction(
        batchIds.map((id) =>
          prisma.ticket.update({
            where: { id },
            data: {
              status,
              qrCodeSecret: TicketService.generateSecret(),
            },
          })
        )
      );
    }
  }

  static async getAvailableTickets(ticketTypeId: number, count?: number) {
    return prisma.ticket.findMany({
      where: {
        ticketTypeId,
        status: TicketStatus.AVAILABLE,
      },
      take: count,
    });
  }

  static async getTicketTypesForEvent(eventId: number, tickets: boolean = true) {
    return prisma.ticketType.findMany({
      where: {
        eventId: eventId,
      },
      include: {
        tickets,
      },
    });
  }

  static async findTicketBySecret(secret: string) {
    return prisma.ticket.findFirst({
      where: { qrCodeSecret: secret },
      include: {
        ticketType: {
          include: {
            event: true,
          }
        },
        bookingTickets: {
          orderBy: { id: 'desc' },
          include: {
            booking: {
              include: {
                user: true,
              }
            }
          }
        }
      }
    });
  }

  static async findTicketByEventAndTicketIds(eventId: number, ticketId: number) {
    return prisma.ticket.findFirst({
      where: {
        id: ticketId,
        ticketType: {
          eventId,
        },
      },
      include: {
        ticketType: {
          include: {
            event: true,
          }
        },
        bookingTickets: {
          orderBy: { id: 'desc' },
          include: {
            booking: {
              include: {
                user: true,
              }
            }
          }
        }
      }
    });
  }

  static async getTicketPurchaseDate(ticket: TicketExtended | number, booking?: Booking | number): Promise<Date | null> {
    if(typeof ticket === 'number' || !ticket.ticketType) {
      const ticketId = typeof ticket === 'number' ? ticket : ticket.id;
      const dbTicket = await TicketService.getTicketById(ticketId);
      if(!dbTicket) throw new Error('Unknown ticket');

      ticket = dbTicket;
    }

    if(ticket.status !== 'SOLD') return null;

    if(booking !== undefined && typeof booking === 'number') {
      const dbBooking = await BookingService.getById(booking);
      if(!dbBooking) throw new BookingError(BookingErrorCodes.INVALID_BOOKING_ID, 'Бронироавние не существует');

      booking = dbBooking;
    }

    if(booking === undefined) {
      const dbBooking = await prisma.booking.findFirst({
        where: {
          status: 'PAID',
          bookingTickets: {
            every: {
              ticket: {
                id: ticket.id,
                status: 'SOLD',
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        }
      });
      if(!dbBooking) throw new BookingError(BookingErrorCodes.INVALID_BOOKING_ID, 'Логическая ошибка: статус билета не соответствует стаусу бронирования');

      booking = dbBooking;
    }

    const eventId = ticket.ticketType!.event.id;
    const purchaseDate = await prisma.actionLog.findFirst({
      where: {
        action: ActionLogAction.BOOKING_PAID,
        targetType: 'booking',
        targetId: booking.id,
        metadata: {
          path: ['events'],
          array_contains: [[eventId]],
        }
      },
      select: {
        createdAt: true,
      },
    });

    return purchaseDate?.createdAt ?? null;
  }
}
