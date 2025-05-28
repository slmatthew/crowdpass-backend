import { prisma } from "@/db/prisma";
import z from "zod";
import { UserService } from "./user.service";
import { TicketTypeError, TicketTypeErrorCodes } from "@/types/errors/TicketTypeError";
import { EventService } from "./eventService";
import { EventError, EventErrorCodes } from "@/types/errors/EventError";
import { Role } from "@prisma/client";

export const createTicketTypeSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1),
  eventId: z.number().int().positive(),
});

export const updateTicketTypeSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  quantity: z.number().int().min(1).optional(),
});

export type CreateTicketTypeDto = z.infer<typeof createTicketTypeSchema>;
export type UpdateTicketTypeDto = z.infer<typeof updateTicketTypeSchema>;

export class TicketTypeService {
  static async getByEvent(eventId: number) {
    return prisma.ticketType.findMany({
      where: { eventId },
      include: { tickets: true },
    });
  }

  static async getById(id: number) {
    return prisma.ticketType.findUnique({
      where: { id },
      include: {
        event: true
      }
    });
  }
  
  static async create(data: CreateTicketTypeDto) {
    const event = await EventService.getEventById(data.eventId);
    if(!event) throw new EventError(EventErrorCodes.EVENT_NOT_FOUND, "Мероприятие не найдено");

    if(event.endDate <= new Date()) throw new TicketTypeError(TicketTypeErrorCodes.EVENT_ALREADY_ENDED, "Мероприятие уже завершилось");

    return prisma.ticketType.create({ data });
  }

  static async update(id: number, data: UpdateTicketTypeDto) {
    const existing = await prisma.ticketType.findUnique({
      where: { id },
      include: { tickets: true },
    });
  
    if (!existing) throw new TicketTypeError(TicketTypeErrorCodes.TICKET_TYPE_NOT_FOUND, "Тип билета не найден");
  
    const issuedCount = existing.tickets.length;
  
    if (data.quantity !== undefined && data.quantity < issuedCount) {
      throw new TicketTypeError(TicketTypeErrorCodes.INVALID_QUANTITY, `Нельзя установить количество меньше ${issuedCount} – столько билетов уже выпущено`);
    }
  
    return prisma.ticketType.update({
      where: { id },
      data,
    });
  }  

  static async remove(id: number, userRole: Role, confirm: boolean = false) {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id },
      include: {
        tickets: {
          include: { bookingTickets: true },
        },
      },
    });
  
    if (!ticketType) throw new Error("Тип билетов не найден");
  
    const soldTickets = ticketType.tickets.filter(t => t.status === "SOLD");
    const reservedTickets = ticketType.tickets.filter(t => t.status === "RESERVED");
  
    if (soldTickets.length > 0 && userRole === "MANAGER") {
      throw new TicketTypeError(TicketTypeErrorCodes.ACCESS_DENIED, "Нельзя удалить тип билетов с уже проданными билетами");
    }
  
    if (reservedTickets.length > 0 && !confirm) {
      throw new TicketTypeError(TicketTypeErrorCodes.NEED_CONFIRM, "Есть активные бронирования. Подтвердите удаление");
    }
  
    const ticketIds = ticketType.tickets.map(t => t.id);
  
    const affectedBookingIds = await prisma.bookingTicket.findMany({
      where: { ticketId: { in: ticketIds } },
      select: { bookingId: true },
      distinct: ['bookingId'],
    }).then(results => results.map(r => r.bookingId));

    await prisma.bookingTicket.deleteMany({
      where: { ticketId: { in: ticketIds } },
    });

    await prisma.booking.updateMany({
      where: {
        id: { in: affectedBookingIds },
        bookingTickets: { none: {} },
        status: "ACTIVE",
      },
      data: { status: "CANCELLED" },
    });

    await prisma.ticket.deleteMany({
      where: { id: { in: ticketIds } },
    });

    return prisma.ticketType.delete({ where: { id } });
  }

  static async canUserManage(userId: number, ticketTypeId?: number, eventId?: number) {
    if(!ticketTypeId && !eventId) throw new Error("ticketTypeId or eventId is required");

    const user = await UserService.findById(userId);
    if(!user || !user.admin) return false;
    if(user.admin.role === 'ROOT' || user.admin.role === 'ADMIN') return true;

    if(ticketTypeId) {
      const ticketType = await this.getById(ticketTypeId);
      if(!ticketType) throw new TicketTypeError(TicketTypeErrorCodes.TICKET_TYPE_NOT_FOUND, 'Неверный ID');

      return user.admin.organizerId === ticketType.event.organizerId;
    }

    if(eventId) {
      const event = await EventService.getEventById(eventId) ?? undefined;
      if(!event) throw new EventError(EventErrorCodes.EVENT_NOT_FOUND, "Мероприятие не найдено");

      return EventService.LcanUserManageEvent(user.admin, event);
    }

    return false;
  }
  
  static async issue(id: number, count: number) {
    const ticketType = await prisma.ticketType.findUnique({ where: { id }, include: { event: true } });
    if(!ticketType) throw new TicketTypeError(TicketTypeErrorCodes.TICKET_TYPE_NOT_FOUND, 'Неверный ID');

    if(ticketType.event.endDate <= new Date()) throw new TicketTypeError(TicketTypeErrorCodes.EVENT_ALREADY_ENDED, "Мероприятие уже завершилось");
  
    const existing = await prisma.ticket.count({ where: { ticketTypeId: id } });
    const remaining = ticketType.quantity - existing;
  
    if(count > remaining) throw new TicketTypeError(TicketTypeErrorCodes.TOO_MANY_TICKETS, `Можно выпустить максимум ${remaining} билетов`);
  
    const realCount = count === 0 ? remaining : count;

    const tickets = Array.from({ length: realCount }).map(() => ({
      ticketTypeId: id,
    }));
  
    return prisma.ticket.createMany({ data: tickets });
  }
}