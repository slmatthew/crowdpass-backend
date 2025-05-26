import {
  XOrganizerShort,
  XCategory, XSubcategory,
  XCompactListResult, XDetailsResult, XEvent, XEventConvert
} from "@/api/types/responses";
import { EventService } from "@/services/eventService";
import { Request, Response } from "express";

export async function compactList(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });

  const { skip, take, categoryId, subcategoryId, search } = req.query;

  const allEvents = (await EventService.searchEvents(
    categoryId ? Number(categoryId) : undefined,
    subcategoryId ? Number(subcategoryId) : undefined,
    search ? search.toString() : undefined
  )).filter(e => !e.isDeleted && e.isPublished);
  
  const eventsList = ((): typeof allEvents => {
    let nSkip = Number(skip) ?? null;
    let nTake = Number(take) ?? null;

    if(skip !== undefined && take !== undefined) {
      nSkip = isNaN(nSkip) ? 0 : nSkip;
      nTake = isNaN(nTake) ? allEvents.length : nTake;

      if(
        nSkip < 0 ||
        nSkip >= allEvents.length ||
        nTake <= 0
      ) return [];

      const start = nSkip;
      const end = Math.min(nSkip + nTake, allEvents.length);
      
      const sliced = allEvents.slice(start, end);
      return sliced;
    }

    return allEvents;
  })();

  const events: XEvent[] = [];
  const organizers = new Map<number, XOrganizerShort>();
  const categories = new Map<number, Omit<XCategory, 'subcategories'>>();
  const subcategories = new Map<number, Omit<XSubcategory, 'category'>>();

  eventsList.forEach(event => {
    organizers.set(event.organizer.id, { id: event.organizer.id, name: event.organizer.name, slug: event.organizer.slug });
    categories.set(event.category.id, { id: event.category.id, name: event.category.name });
    subcategories.set(event.subcategory.id, { id: event.subcategory.id, name: event.subcategory.name, categoryId: event.subcategory.categoryId });

    const prices = event.ticketTypes.map(t => Number(t.price));
    const compactEvent = XEventConvert.fromShared(event, {
      min: Math.min(...prices) || 0,
      max: Math.max(...prices) || 0,
    });

    events.push(compactEvent);
  });

  const result: XCompactListResult = {
    events,
    totalCount: allEvents.length,
    organizers: Array.from(organizers.values()),
    categories: Array.from(categories.values()),
    subcategories: Array.from(subcategories.values()),
  };

  res.json(result);
}

export async function details(req: Request, res: Response) {
  const { id } = req.params;
  const event = await EventService.getEventOverview(Number(id));

  if(!event) return res.status(404).json({ message: 'Мероприятие не найдено' });

  const result: XDetailsResult = XEventConvert.fromSharedWithStats(event);

  res.json(result);
}