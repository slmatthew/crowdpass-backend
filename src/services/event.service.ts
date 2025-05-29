import { prisma } from '../db/prisma';
import { Admin, Category, Event, Organizer, Prisma, Role, TicketType } from '@prisma/client';
import { CommonError, CommonErrorCodes } from '@/types/errors/CommonError';
import { AdminUser } from './user.service';
import { ActionLogAction } from '@/constants/appConstants';

export const EventErrorCodes = {
  MANAGER_NOT_ALLOWED: "EC-001",
} as const;

export class EventError extends CommonError {
  code: string;
  metadata?: any;

  constructor(code: string, message: string, metadata?: any) {
    super(code, message, metadata);
    this.name = "EventError";
    this.code = code;
    this.metadata = metadata;
  }
}

type EventUpdateData = Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>>;
type EventCreateData = Omit<Required<EventUpdateData>, 'posterUrl'> & { posterUrl?: string | null; };

const sharedEvent = Prisma.validator<Prisma.EventDefaultArgs>()({
  include: {
    organizer: true,
    category: true,
    subcategory: true,
    ticketTypes: true,
  },
});

export type SharedEvent = Prisma.EventGetPayload<
  typeof sharedEvent
>;

export type EventStats = {
  totalTickets: number;
  availableTickets: number;
  reservedTickets: number;
  soldTickets: number;
  usedTickets: number;
};

export type SharedEventWithStats = Omit<SharedEvent, 'ticketTypes'> & {
  ticketTypes: Array<
    SharedEvent['ticketTypes'][number] & {
      stats: EventStats;
    }
  >;
  stats: EventStats;
};

export class EventService {
  static _canUserManageEvent(admin?: Admin, event?: Event): boolean {
    if(!event) throw new EventError(CommonErrorCodes.EVENT_NOT_FOUND, 'Мероприятие не найдено');

    if(!admin) return false;
    if(admin.role === Role.ROOT || admin.role === Role.ADMIN) return true;
    if(admin.role === Role.MANAGER && admin.organizerId === event.organizerId) return true;

    return false;
  }

  static async searchShared(
    { upcoming = true, isPublished, isSalesEnabled }: {
      upcoming?: boolean;
      isPublished?: boolean;
      isSalesEnabled?: boolean;
    } = {},
    { categoryId, subcategoryId, search }: {
      categoryId?: number;
      subcategoryId?: number;
      search?: string;
    } = {},
    { take, skip }: {
      take?: number;
      skip?: number;
    } = {},
  ): Promise<SharedEvent[]> {
    return prisma.event.findMany({
      where: {
        endDate: upcoming ? {
          gte: new Date(),
        } : undefined,
        name: search,
        categoryId,
        subcategoryId,
        isPublished,
        isSalesEnabled,
      },
      take,
      skip,
      ...sharedEvent,
      orderBy: {
        startDate: 'asc'
      }
    });
  }

  static async findByIdShared(id: number): Promise<SharedEvent | null> {
    return prisma.event.findUnique({
      where: { id },
      ...sharedEvent,
    });
  }

  static async findById(id: number): Promise<Event | null> {
    return prisma.event.findUnique({ where: { id } });
  }

  static async getOverview(id: number): Promise<null | SharedEventWithStats> {
    const event = await EventService.findByIdShared(id);
    if(!event) return null;
  
    const ticketStats = await prisma.ticket.groupBy({
      by: ['ticketTypeId', 'status'],
      where: {
        ticketType: { eventId: id },
      },
      _count: { _all: true },
    });
  
    const ticketTypeStats: Record<number, EventStats> = {};
    for (const type of event.ticketTypes) {
      ticketTypeStats[type.id] = {
        totalTickets: 0,
        availableTickets: 0,
        reservedTickets: 0,
        soldTickets: 0,
        usedTickets: 0,
      };
    }
  
    for (const stat of ticketStats) {
      const entry = ticketTypeStats[stat.ticketTypeId];
      entry.totalTickets += stat._count._all;
  
      switch (stat.status) {
        case 'AVAILABLE':
          entry.availableTickets += stat._count._all;
          break;
        case 'RESERVED':
          entry.reservedTickets += stat._count._all;
          break;
        case 'SOLD':
          entry.soldTickets += stat._count._all;
          break;
        case 'USED':
          entry.usedTickets += stat._count._all;
          break;
      }
    }
  
    const ticketTypesWithStats = event.ticketTypes.map((type) => ({
      ...type,
      stats: ticketTypeStats[type.id] || {
        totalTickets: 0,
        availableTickets: 0,
        reservedTickets: 0,
        soldTickets: 0,
        usedTickets: 0,
      } as EventStats,
    }));
  
    const stats: EventStats = Object.values(ticketTypeStats).reduce(
      (acc, stat) => {
        acc.totalTickets += stat.totalTickets;
        acc.availableTickets += stat.availableTickets;
        acc.reservedTickets += stat.reservedTickets;
        acc.soldTickets += stat.soldTickets;
        acc.usedTickets += stat.usedTickets;
        return acc;
      },
      {
        totalTickets: 0,
        availableTickets: 0,
        reservedTickets: 0,
        soldTickets: 0,
        usedTickets: 0,
      }
    );
  
    return {
      ...event,
      ticketTypes: ticketTypesWithStats,
      stats,
    };
  }  

  static async getPopular(): Promise<Array<Event & {
    ticketTypes: TicketType[];
    organizer: Organizer | null;
    category: Category | null;
    soldCount: number;
  }>> {
    const events = await prisma.event.findMany({
      where: {
        endDate: { gte: new Date() },
        isPublished: true,
        isSalesEnabled: true,
      },
      include: {
        ticketTypes: {
          include: { tickets: true },
        },
        organizer: true,
        category: true,
      },
    });
  
    return events
      .map((event) => {
        const soldCount = event.ticketTypes
          .flatMap((tt) => tt.tickets)
          .filter((t) => t.status === 'SOLD').length;
        
        const ticketTypes = event.ticketTypes.map(({ tickets, ...tt }) => tt);
  
        return { ...event, ticketTypes, soldCount };
      })
      .sort((a, b) => b.soldCount - a.soldCount);
  }

  static async getManagers(id: number, extended: boolean = false): Promise<Array<AdminUser> | Array<number>> {
    const event = await prisma.event.findUnique({
      where: { id },
    });
    if (!event) throw new EventError(CommonErrorCodes.EVENT_NOT_FOUND, 'Мероприятие не найдено');

    const managers = await prisma.admin.findMany({
      where: { organizerId: event.organizerId },
      include: { user: true }
    });

    const result = extended ? managers : managers.map((m) => m.id);
    return result;
  }

  static async canUserManage(userId: number, eventId: number): Promise<boolean> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    }) ?? undefined;

    const admin = await prisma.admin.findUnique({
      where: { userId },
    }) ?? undefined;

    return this._canUserManageEvent(admin, event);
  }

  static async update(id: number, data: EventUpdateData) {
    return prisma.event.update({
      where: { id },
      data,
    });
  };
  
  static async create(data: EventCreateData): Promise<Event> {
    return prisma.event.create({
      data,
    });
  };

  static async getSalesByDay(eventId: number): Promise<{
    day: string;
    value: number;
  }[]> {
    const logs = await prisma.actionLog.findMany({
      where: {
        action: ActionLogAction.BOOKING_PAID,
        metadata: {
          path: ['events'],
          array_contains: [[eventId]],
        },
      },
      select: {
        createdAt: true,
        metadata: true,
      },
    });

    const result: Record<string, number> = {};

    for(const log of logs) {
      const date = log.createdAt.toISOString().slice(0, 10);
      const entry = (log.metadata as any).events?.find((e: [number, number]) => e[0] === eventId);

      if(entry) {
        result[date] = (result[date] || 0) + entry[1];
      }
    }

    return Object.entries(result)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, value]) => ({ day, value }));
  }

  static async getEventTotalRevenue(eventId: number): Promise<number> {
    const logs = await prisma.actionLog.findMany({
      where: {
        action: ActionLogAction.BOOKING_PAID,
        metadata: {
          path: ['events'],
          array_contains: [[eventId]],
        },
      },
      select: {
        metadata: true,
      },
    });

    let total = 0;
    for(const log of logs) {
      const entry = (log.metadata as any).events?.find((e: [number, number]) => e[0] === eventId);
      if(entry) {
        total += entry[1];
      }
    }

    return total;
  }

  static format<T>(event: Event | SharedEvent | SharedEventWithStats, mode: 'safe'): T {
    switch(mode) {
      case 'safe': default:
        return (({
          isPublished, isSalesEnabled, createdAt, updatedAt,
          organizer, category, subcategory, ticketTypes,
          ...event
        }: any) => event)(event);
    }
  }
}