import { Request, Response } from "express";
import { EventService } from "@/services/eventService";
import { z } from "zod";
import { logAction } from "../../../utils/logAction";
import { extractQueryOptions, formatEvent } from "../../utils/formatters";
import { getPrismaIncludeOptions } from "../../utils/formatters/formatEvent";
import { privileges } from "@/api/utils/privileges";

export async function getAllEvents(req: Request, res: Response) {
  const { extended, fields } = extractQueryOptions(req);

  const events = await EventService.getAllEvents(false, getPrismaIncludeOptions({ extended, fields }));
  res.json(events);
}

export async function getPopularEvents(req: Request, res: Response) {
  const events = await EventService.getPopularEventsSorted();
  res.json(events);
}

export async function getEventById(req: Request, res: Response) {
  const { extended: qExtended } = req.query;
  const extended = qExtended === 'true' || qExtended === '1';

  const id = Number(req.params.id);
  const event =
    extended ? await EventService.getEventById(id, {
			organizer: true,
			category: true,
			subcategory: true,
			ticketTypes: true,
		})
    : await EventService.getEventById(id);

  if (!event) return res.status(404).json({ message: 'Мероприятие не найдено' });
  res.json(event);
}

export async function getEventOverview(req: Request, res: Response) {
  const id = Number(req.params.id);

  if(!privileges.events.update(req.user!, id)) return res.status(403).json({ message: "Нет доступа" });

  const event = await EventService.getEventOverview(id);
  if(!event) return res.status(404).json({ message: 'Мероприятие не найдено' });

  let total = 0, available = 0, reserved = 0, sold = 0, used = 0;
  
  for (const type of event.ticketTypes) {
    for (const ticket of type.tickets) {
      total++;
      switch (ticket.status) {
        case "AVAILABLE":
          available++;
          break;
        case "RESERVED":
          reserved++;
          break;
        case "SOLD":
          sold++;
          break;
        case "USED":
          used++;
          break;
      }
    }
  }

  const fEvent = await formatEvent(event, {
    extended: true,
    fields: ['organizer', 'category', 'subcategory', 'ticketTypes'],
  });

  res.json({
    ...fEvent,
    stats: {
      totalTickets: total,
      availableTickets: available,
      reservedTickets: reserved,
      soldTickets: sold,
      usedTickets: used,
    },
  });
}

const updateEventSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  organizerId: z.coerce.number(),
  categoryId: z.coerce.number(),
  subcategoryId: z.coerce.number(),
});

export async function updateEventById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if(!privileges.events.update(req.user!, id)) return res.status(403).json({ message: "Нет доступа" });

    const validated = updateEventSchema.parse(req.body);
    
    const prev = await EventService.getEventById(id);
    if (!prev) return res.status(404).json({ message: 'Мероприятие не найдено' });

    const updatedEvent = await EventService.updateEvent(id, validated);

    await logAction({
      actorId: req.user?.id || 0,
      action: 'event.update',
      targetType: 'event',
      targetId: id,
      metadata: {
        before: prev,
        after: updatedEvent,
      }
    });

    res.json(updatedEvent);
  } catch (err: any) {
    console.error("Ошибка при обновлении события:", err);

    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Невалидные данные", errors: err.errors });
    }

    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};

export async function createEvent(req: Request, res: Response) {
  try {
    const data = updateEventSchema.parse(req.body); // та же схема подходит

    if(!privileges.events.create(req.user!, data.organizerId)) return res.status(403).json({ message: "Нет доступа" }); 

    const created = await EventService.createEvent(data);

    const adminId = req.user?.id;
    if (adminId) {
      await logAction({
        actorId: req.user?.id || 0,
        action: 'event.create',
        targetType: 'event',
        targetId: created.id,
        metadata: created
      });
    }

    res.status(201).json(created);
  } catch (err: any) {
    console.error("Ошибка при создании события:", err);

    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Невалидные данные", errors: err.errors });
    }

    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}