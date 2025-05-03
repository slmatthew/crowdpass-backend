import { EventError, EventErrorCodes } from '@/types/errors/EventError';
import { prisma } from '../db/prisma';
import { Role } from '@prisma/client';

export class EventService {
  static async getAllEvents(
    include: {
      organizer?: boolean,
      category?: boolean,
      subcategory?: boolean,
      ticketTypes?: boolean,
    } = {},
    orderBy: { startDate?: 'asc' | 'desc' } = { startDate: 'asc' }
  ) {
    return prisma.event.findMany({
      include,
      orderBy,
    });
  }

  static async getEventById(id: number) {
    return prisma.event.findUnique({
      where: { id },
    });
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
    });
    if(!event) throw new EventError(EventErrorCodes.EVENT_NOT_FOUND, 'Мероприятие не найдено');

    const admin = await prisma.admin.findUnique({
      where: { userId },
    });

    if(!admin) return false;
    if(admin.role === Role.ROOT || admin.role === Role.ADMIN) return true;
    if(admin.role === Role.MANAGER && admin.organizerId === event.organizerId) return true;

    return false;
  }
}

export async function getAllEventsWithDetails() {
	return prisma.event.findMany({
		include: {
			organizer: true,
			category: true,
			subcategory: true,
		},
		orderBy: { startDate: 'asc' },
	});
}

export async function getPopularEventsSorted() {
	const events = await prisma.event.findMany({
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

export async function getEventById(id: number) {
  return prisma.event.findUnique({
    where: { id },
  });
};

export async function getEventDetailsById(id: number) {
	return prisma.event.findUnique({
		where: { id },
		include: {
			organizer: true,
			category: true,
			subcategory: true,
			ticketTypes: true,
		},
	});
}

interface UpdateEventData {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  organizerId: number;
  categoryId: number;
  subcategoryId: number;
}

export async function updateEvent(id: number, data: UpdateEventData) {
  return prisma.event.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      location: data.location,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      organizerId: data.organizerId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
    },
  });
};

export async function createEvent(data: UpdateEventData) {
  return prisma.event.create({
    data: {
      name: data.name,
      description: data.description,
      location: data.location,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      organizerId: data.organizerId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
    },
  });
};