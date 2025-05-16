import { formatUser } from "@/api/utils/formatters";
import { BookingService } from "@/services/bookingService";
import { EventService } from "@/services/eventService";
import { BookingStatus, Event } from "@prisma/client";
import { Request, Response } from "express";

export async function me(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });

  return res.json({ user: req.user });
}

export async function dashboard(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });

  let events: Event[] = await EventService.getPopularEventsSorted();
  if(events.length === 0) {
    events = await EventService.getAllEvents();
  }

  events = events.slice(0, 3);
  events = events.map(e => ({
    name: e.name,
    id: e.id,
    description: e.description,
    startDate: e.startDate,
    endDate: e.endDate,
    location: e.location,
    posterUrl: e.posterUrl,
    organizerId: e.organizerId,
    categoryId: e.categoryId,
    subcategoryId: e.subcategoryId,
  }));

  const bookings = (await BookingService.getByUserId(req.user.id)).length;

  const bookedTickets = await BookingService.getByUserId(req.user.id, BookingStatus.PAID);
  const tickets = (() => {
    let count = 0;
    for(const booking of bookedTickets) {
      for(const bt of booking.bookingTickets) {
        if(bt.ticket.ticketType.event) {
          if(new Date(bt.ticket.ticketType.event.endDate).getTime() > Date.now()) {
            count++;
          }
        }
      }
    }

    return count;
  })();

  return res.json({
    events,
    bookings,
    tickets,
  });
}