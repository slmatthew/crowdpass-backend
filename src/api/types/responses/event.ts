import { SharedEvent, SharedEventWithStats } from "@/db/types/event";
import { Event, TicketType } from "@prisma/client";
import { XOrganizer, XOrganizerShort } from "./organizer";
import { XCategory, XSubcategory } from "./category";

export type XEventShort = {
  id: number;
  slug: string | null;
  name: string;
  startDate: Date;
  endDate: Date;
};

export type XEvent = Omit<
  Event,
  'isPublished' | 'isSalesEnabled' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt' |
  'endDate' | 'organizer' | 'category' | 'subcategory' | 'ticketTypes'
> & {
  prices: {
    min: number;
    max: number;
  };
};

export type XEventWithStats = Omit<
  SharedEvent,
  'organizerId' | 'categoryId' | 'subcategoryId' | 'stats' | 'ticketTypes' |
  'isPublished' | 'isSalesEnabled' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt' |
  'organizer' | 'category' | 'subcategory'
> & {
  ticketTypes: Array<TicketType & { available: number }>;
  organizer: XOrganizer;
  category: Omit<XCategory, 'subcategories'>;
  subcategory: Omit<XSubcategory, 'category'>;
};

export const XEventConvert = {
  fromShared: (event: SharedEvent, prices: XEvent['prices'] = { min: 0, max: 0 }): XEvent => ({
    id: event.id,
    slug: event.slug,
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    location: event.location,
    posterUrl: event.posterUrl,
    organizerId: event.organizerId,
    categoryId: event.categoryId,
    subcategoryId: event.subcategoryId,
    prices,
  }),
  fromSharedWithStats: (event: SharedEventWithStats): XEventWithStats => ({
    id: event.id,
    slug: event.slug,
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    posterUrl: event.posterUrl,
    organizer: event.organizer,
    category: { id: event.category.id, name: event.category.name },
    subcategory: { id: event.subcategory.id, name: event.subcategory.name, categoryId: event.category.id },
    ticketTypes: event.ticketTypes.map(tt => ({
      id: tt.id,
      name: tt.name,
      price: tt.price,
      available: tt.stats.availableTickets
    })) as XEventWithStats['ticketTypes'],
  }),
  toShort<T extends XEventShort>(event: T): XEventShort {
    return {
      id: event.id,
      slug: event.slug,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
    };
  }
};

export type XCompactListResult = {
  events: XEvent[];
  totalCount: number;
  organizers: XOrganizerShort[];
  categories: { id: number; name: string; }[];
  subcategories: { id: number; name: string; categoryId: number; }[];
};
export type XDetailsResult = XEventWithStats;