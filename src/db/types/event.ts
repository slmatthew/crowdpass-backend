import { Prisma, TicketType } from "@prisma/client";

export const sharedEvent = Prisma.validator<Prisma.EventDefaultArgs>()({
  include: {
    organizer: true,
    category: true,
    subcategory: true,
    ticketTypes: true,
  },
});

export type SharedEvent = Prisma.EventGetPayload<
  typeof sharedEvent
>;

export type SharedEventPartial = Omit<SharedEvent, 'organizer' | 'category' | 'subcategory' | 'ticketTypes'> & {
  organizer?: SharedEvent['organizer'];
  category?: SharedEvent['category'];
  subcategory?: SharedEvent['subcategory'];
  ticketTypes?: SharedEvent['ticketTypes'];
};

type EventStats = {
  totalTickets: number;
  availableTickets: number;
  reservedTickets: number;
  soldTickets: number;
  usedTickets: number;
};

export type SharedEventWithStats = Omit<SharedEvent, 'ticketTypes'> & {
  ticketTypes: Array<
    TicketType & {
      stats: EventStats;
    }
  >;
  stats: EventStats;
};