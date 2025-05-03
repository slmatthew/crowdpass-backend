import { prisma } from "../db/prisma";

export interface LogFilters {
  actorId?: number;
  action?: string;
  targetType?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  }
}

export class AdminDashboardService {
  static async getSummary() {
    const [ticketCount, soldTicketCount, eventCount, userCount, bookingCount] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "SOLD" } }),
      prisma.event.count(),
      prisma.user.count(),
      prisma.booking.count(),
    ]);
  
    return {
      ticketCount,
      soldTicketCount,
      eventCount,
      userCount,
      bookingCount,
    };
  }

  static async getLogs(filters: LogFilters = {}, skip?: number, take?: number) {
    const [logs, total] = await Promise.all([
      prisma.actionLog.findMany({
        where: filters,
        include: { actor: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.actionLog.count({ where: filters }),
    ]);

    return { logs, total };
  }
}