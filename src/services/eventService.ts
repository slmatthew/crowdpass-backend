import { EventError, EventErrorCodes } from '@/types/errors/EventError';
import { prisma } from '../db/prisma';
import { Admin, Event, Role } from '@prisma/client';

interface EventExtendedOptions {
  organizer?: boolean,
  category?: boolean,
  subcategory?: boolean,
  ticketTypes?: boolean,
}

interface UpdateEventData {
  name: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  organizerId: number;
  categoryId: number;
  subcategoryId: number;
}

export class EventService {
  static LcanUserManageEvent(admin?: Admin, event?: Event) {
    if(!event) throw new EventError(EventErrorCodes.EVENT_NOT_FOUND, 'Мероприятие не найдено');

    if(!admin) return false;
    if(admin.role === Role.ROOT || admin.role === Role.ADMIN) return true;
    if(admin.role === Role.MANAGER && admin.organizerId === event.organizerId) return true;

    return false;
  }

  static async getAllEvents(
    upcoming: boolean = true,
    include: EventExtendedOptions = {},
    orderBy: { startDate?: 'asc' | 'desc' } = { startDate: 'asc' },
  ) {
    const where = upcoming ? { endDate: { gte: new Date() } } : {};

    return prisma.event.findMany({
      where,
      include,
      orderBy,
    });
  }

  static async getEventsByCategoryId(categoryId: number) {
    return prisma.event.findMany({
      where: {
        categoryId,
        endDate: {
          gte: new Date()
        }
      },
      orderBy: { startDate: 'asc' },
    });
  }

  static async getEventsBySubcategoryId(subcategoryId: number) {
    return prisma.event.findMany({
      where: {
        subcategoryId,
        endDate: {
          gte: new Date()
        }
      },
      orderBy: { startDate: 'asc' },
    });
  }

  static async getEventById(id: number, include: EventExtendedOptions = {}) {
    return prisma.event.findUnique({
      where: { id },
      include,
    });
  }

  static async getEventOverview(id: number) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: true,
        category: true,
        subcategory: true,
        ticketTypes: true,
      },
    });
  
    if (!event) return null;
  
    const ticketStats = await prisma.ticket.groupBy({
      by: ['ticketTypeId', 'status'],
      where: {
        ticketType: { eventId: id },
      },
      _count: { _all: true },
    });
  
    const ticketTypeStats: Record<number, any> = {};
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
      },
    }));
  
    const stats = Object.values(ticketTypeStats).reduce(
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

  static async getPopularEventsSorted() {
    const events = await prisma.event.findMany({
      where: { endDate: { gte: new Date() } },
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
  
        return { ...event, soldCount };
      })
      .sort((a, b) => b.soldCount - a.soldCount);
  }

  static async getEventManagers(id: number, extended: boolean = false) {
    const event = await prisma.event.findUnique({
      where: { id },
    });
    if (!event) throw new EventError(EventErrorCodes.EVENT_NOT_FOUND, 'Мероприятие не найдено');

    const managers = await prisma.admin.findMany({
      where: { organizerId: event.organizerId },
    });

    const result = extended ? managers : managers.map((m) => m.id);
    return result;
  }

  static async canUserManageEvent(userId: number, eventId: number) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    }) ?? undefined;

    const admin = await prisma.admin.findUnique({
      where: { userId },
    }) ?? undefined;

    return this.LcanUserManageEvent(admin, event);
  }

  static async updateEvent(id: number, data: UpdateEventData) {
    return prisma.event.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        organizerId: data.organizerId,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
      },
    });
  };
  
  static async createEvent(data: UpdateEventData) {
    return prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        organizerId: data.organizerId,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
      },
    });
  };
}

export async function getEventById(id: number) {
  return prisma.event.findUnique({
    where: { id },
  });
};