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
  
  static async getRegistersByDay(): Promise<{
    day: string;
    count: number;
  }[]> {
    const users = await prisma.user.findMany({
      select: {
        createdAt: true,
      }
    });

    const registrationsByDay: Record<string, number> = {};

    for(const user of users) {
      const day = user.createdAt.toISOString().slice(0, 10);
      registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
    }

    return Object.entries(registrationsByDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, count]) => ({ day, count }));
  }
}