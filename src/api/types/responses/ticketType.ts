import { TicketType } from "@prisma/client";

export type XTicketType = {
  id: number;
  eventId: number;
  slug: string | null;
  name: string;
  price: number;
};

export const XTicketTypeFormat = {
  default<T extends TicketType>(ticketType: T): XTicketType {
    return {
      id: ticketType.id,
      eventId: ticketType.eventId,
      slug: ticketType.slug,
      name: ticketType.name,
      price: Number(ticketType.price),
    };
  },
};