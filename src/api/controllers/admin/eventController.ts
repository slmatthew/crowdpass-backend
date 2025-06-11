import { Request, Response } from "express";
import { EventService } from "@/services/event.service";
import { z } from "zod";
import { logAction } from "../../../utils/logAction";
import { privileges } from "@/api/utils/privileges";
import { ActionLogAction } from "@/constants/appConstants";

export async function getAllEvents(req: Request, res: Response) {
  const events = await EventService.searchShared({ upcoming: false });
  res.json(events);
}

export async function getPopularEvents(req: Request, res: Response) {
  const events = await EventService.getPopular();
  res.json(events);
}

export async function getEventById(req: Request, res: Response) {
  const { extended: qExtended } = req.query;
  const extended = qExtended === 'true' || qExtended === '1';

  const id = Number(req.params.id);
  const event =
    extended ? await EventService.findByIdShared(id)
    : await EventService.findById(id);

  if(!event) return res.status(404).json({ message: 'Мероприятие не найдено' });
  res.json(event);
}

export async function getEventOverview(req: Request, res: Response) {
  const id = Number(req.params.id);
  if(!(await privileges.events.update(req.user!, id))) {
    return res.status(403).json({ message: "Нет доступа" });
  }

  const event = await EventService.getOverview(id);
  if(!event) return res.status(404).json({ message: 'Мероприятие не найдено' });

  const revenue = await EventService.getEventTotalRevenue(event.id);
  (event as any).revenue = revenue;

  res.json(event);
}

export async function getEventSalesByDay(req: Request, res: Response) {
  const id = Number(req.params.id);
  if(!(await privileges.events.update(req.user!, id))) {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }

  const result = await EventService.getSalesByDay(id);
  res.json(result);
}

const updateEventSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().min(1).optional(),
  posterUrl: z.string().url().optional(),
  organizerId: z.coerce.number().optional(),
  categoryId: z.coerce.number().optional(),
  subcategoryId: z.coerce.number().optional(),
  isPublished: z.coerce.boolean().optional(),
  isSalesEnabled: z.coerce.boolean().optional(),
});

const createEventSchema = updateEventSchema
  .required({
    name: true,
    description: true,
    startDate: true,
    endDate: true,
    location: true,
    organizerId: true,
    categoryId: true,
    subcategoryId: true,
  })
  .omit({
    isPublished: true,
    isSalesEnabled: true,
  });

export async function updateEventById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if(!(await privileges.events.update(req.user!, id))) return res.status(403).json({ message: "Нет доступа" });

    const validated = updateEventSchema.parse(req.body);
    
    const prev = await EventService.findByIdShared(id);
    if(!prev) return res.status(404).json({ message: 'Мероприятие не найдено' });

    if(validated.isSalesEnabled && prev.ticketTypes.length === 0)
      return res.status(400).json({ message: 'Перед началом продаж необходимо добавить минимум 1 тип билетов' });

    const updatedEvent = await EventService.update(id, {
      ...validated,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
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

    if(err instanceof z.ZodError) {
      return res.status(400).json({ message: "Невалидные данные", errors: err.errors });
    }

    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};

export async function createEvent(req: Request, res: Response) {
  try {
    const data = createEventSchema.parse(req.body);

    if(!privileges.events.create(req.user!, data.organizerId)) return res.status(403).json({ message: "Нет доступа" }); 

    const created = await EventService.create({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isPublished: false,
      isSalesEnabled: false,
    });

    const adminId = req.user?.id;
    if(adminId) {
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

    if(err instanceof z.ZodError) {
      return res.status(400).json({ message: "Невалидные данные", errors: err.errors });
    }

    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}