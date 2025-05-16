import { EventService } from "@/services/eventService";
import { Event } from "@prisma/client";
import { Request, Response } from "express";

type IdNamePair = { id: number, name: string };
type CompactEvent = Omit<Event, 'endDate' | 'organizer' | 'category' | 'subcategory' | 'ticketTypes'> & {
  prices: {
    min: number;
    max: number;
  };
};

export async function compactList(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });

  const { skip, take } = req.query;

  const allEvents = await EventService.getAllEvents(true, { organizer: true, category: true, subcategory: true, ticketTypes: true });
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

  const events: CompactEvent[] = [];
  const organizers = new Map<number, IdNamePair>();
  const categories = new Map<number, IdNamePair>();
  const subcategories = new Map<number, IdNamePair>();

  eventsList.forEach(event => {
    organizers.set(event.organizer.id, { id: event.organizer.id, name: event.organizer.name });
    categories.set(event.category.id, { id: event.category.id, name: event.category.name });
    subcategories.set(event.subcategory.id, { id: event.subcategory.id, name: event.subcategory.name });

    const prices = event.ticketTypes.map(t => Number(t.price));
    const compactEvent = {
      ...event,
      organizer: undefined,
      category: undefined,
      subcategory: undefined,
      ticketTypes: undefined,
      prices: {
        min: Math.min(...prices) || 0,
        max: Math.max(...prices) || 0,
      },
    } as CompactEvent;

    events.push(compactEvent);
  });

  res.json({
    events,
    totalCount: allEvents.length,
    organizers: Array.from(organizers.values()),
    categories: Array.from(categories.values()),
    subcategories: Array.from(subcategories.values()),
  });
}

export async function details(req: Request, res: Response) {
  const { id } = req.params;
  const event = await EventService.getEventOverview(Number(id));

  if(!event) return res.status(404).json({ message: 'Мероприятие не найдено' });

  (event as any).ticketTypes = event.ticketTypes.map(tt => ({
    id: tt.id,
    name: tt.name,
    price: tt.price,
    available: tt.stats.availableTickets
  }));

  (event as any).organizerId = undefined;
  (event as any).categoryId = undefined;
  (event as any).subcategoryId = undefined;
  (event as any).stats = undefined;

  res.json(event);
}