import { prisma } from "../db/prisma";
import { TicketStatus } from "@prisma/client";
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

  static async updateStatus(ticketId: number, status: TicketStatus) {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        qrCodeSecret: TicketService.generateSecret(),
      },
    });
  }

  static async updateStatusMany(ticketIds: number[], status: TicketStatus) {
    return prisma.ticket.updateMany({
      where: {
        id: { in: ticketIds },
      },
      data: {
        status,
        qrCodeSecret: TicketService.generateSecret(),
      },
    });
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
}
