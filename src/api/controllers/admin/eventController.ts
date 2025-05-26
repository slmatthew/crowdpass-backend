import { Request, Response } from "express";
import { EventService } from "@/services/eventService";
import { z } from "zod";
import { logAction } from "../../../utils/logAction";
import { extractQueryOptions } from "../../utils/formatters";
import { getPrismaIncludeOptions } from "../../utils/formatters/formatEvent";
import { privileges } from "@/api/utils/privileges";
import { ActionLogAction } from "@/constants/appConstants";
import { SharedEventWithStats } from "@/db/types";

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

type EventOverview = SharedEventWithStats & {
  revenue: number;
};

export async function getEventOverview(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!(await privileges.events.update(req.user!, id))) {
    return res.status(403).json({ message: "Нет доступа" });
  }

  const event = await EventService.getEventOverview(id);
  if (!event) return res.status(404).json({ message: 'Мероприятие не найдено' });

  const revenue = await EventService.getEventTotalRevenue(event.id);
  (event as EventOverview).revenue = revenue;

  res.json(event);
}

export async function getEventSalesByDay(req: Request, res: Response) {
  const id = Number(req.params.id);
  if(!(await privileges.events.update(req.user!, id))) {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }

  const result = await EventService.getEventSalesByDay(id);
  res.json(result);
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
  isPublished: z.coerce.boolean(),
  isSalesEnabled: z.coerce.boolean(),
});

export async function updateEventById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if(!(await privileges.events.update(req.user!, id))) return res.status(403).json({ message: "Нет доступа" });

    const validated = updateEventSchema.parse(req.body);
    
    const prev = await EventService.getEventById(id);
    if (!prev) return res.status(404).json({ message: 'Мероприятие не найдено' });

    const updatedEvent = await EventService.updateEvent(id, {
      ...validated,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
    });

    await logAction({
      actorId: req.user?.id || 0,
      action: ActionLogAction.EVENT_UPDATE,
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

    const created = await EventService.createEvent({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });

    const adminId = req.user?.id;
    if (adminId) {
      await logAction({
        actorId: req.user?.id || 0,
        action: ActionLogAction.EVENT_CREATE,
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