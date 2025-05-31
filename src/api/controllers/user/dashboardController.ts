import { formatUser } from "@/api/utils/formatters";
import { BookingService } from "@/services/bookingService";
import { EventService, SharedEvent } from "@/services/event.service";
import { BookingStatus, Category, Event, Organizer, TicketType } from "@prisma/client";
import { Request, Response } from "express";
import { features } from "@/services/featuresService";

export async function me(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });

  const phone = (() => {
    if(req.user.phone) {
      const phoneLength = req.user.phone.length;

      let phone = '';
      phone += req.user.phone.slice(0, 1);
      phone += '*'.repeat(phoneLength - 5);
      phone += req.user.phone.slice(phoneLength - 4);

      return phone;
    }

    return req.user.phone;
  })();

  const user = {
    ...req.user,
    phone,
  };

  return res.json({ user });
}

type SafeEvent = Omit<
  Event,
  'isPublished' | 'isSalesEnabled' |
  'createdAt' | 'updatedAt'
>;

export async function dashboard(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });

  let result: SafeEvent[] = [];

  const popular = await EventService.getPopular();
  const popularFiltered = popular.filter(pe => pe.isPublished && pe.isSalesEnabled);

  if(popularFiltered.length === 0) {
    const events = await EventService.searchShared({ isPublished: true, isSalesEnabled: true });
    result = events.slice(0, 3).map((event) => EventService.format<SafeEvent>(event, 'safe'));
  } else {
    result = popularFiltered.slice(0, 3).map((event) => EventService.format<SafeEvent>(event, 'safe'));
  }

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
    events: result,
    bookings,
    tickets,
  });
}

export async function getFeatures(req: Request, res: Response) {
  const isTelegramPaymentsWorking = features.isTelegramPaymentsWorking();

  res.json({
    "tp": isTelegramPaymentsWorking,
    "stable": process.env.NODE_ENV === 'production',
    "ap": {
      "ban": true,
    },
  });
}