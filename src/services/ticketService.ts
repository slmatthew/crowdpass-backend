import { prisma } from "../db/prisma";
import { Ticket, TicketStatus } from "@prisma/client";
import { randomBytes } from "crypto";

export class TicketService {
  static generateSecret(): string {
    return randomBytes(16).toString('hex');
  }

  static async getTicketById(ticketId: number) {
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
}
