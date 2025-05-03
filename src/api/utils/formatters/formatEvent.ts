import { prisma } from "../../../db/prisma"; // путь подгони
import { Event } from "@prisma/client";
import { FormatOptions } from "./formatOptions";

export function getPrismaIncludeOptions(options: FormatOptions = {}) {
  const { extended, fields = [] } = options;

  const include: any = {};

  if(extended) {
    if(fields.includes("organizer")) {
      include.organizer = true;
    }
    if(fields.includes("category")) {
      include.category = true;
    }
    if(fields.includes("subcategory")) {
      include.subcategory = true;
    }
    if(fields.includes("ticketTypes")) {
      include.ticketTypes = {
        include: { tickets: false },
      };
    }
  }

  return include;
}

export async function formatEvent(event: Event & {
  organizer?: any;
  category?: any;
  subcategory?: any;
  ticketTypes?: any[];
}, options: FormatOptions = {}) {
  const { extended, fields = [] } = options;

  const result: any = {
    id: event.id,
    name: event.name,
    description: event.description,
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    posterUrl: event.posterUrl,
    organizerId: event.organizerId,
    categoryId: event.categoryId,
    subcategoryId: event.subcategoryId,
  };

  if (!extended) return result;

  if (fields.includes("organizer")) {
    result.organizer = event.organizer ?? await prisma.organizer.findUnique({
      where: { id: event.organizerId },
    });
  }

  if (fields.includes("category")) {
    result.category = event.category ?? await prisma.category.findUnique({
      where: { id: event.categoryId },
    });
  }

  if (fields.includes("subcategory")) {
    result.subcategory = event.subcategory ?? await prisma.subcategory.findUnique({
      where: { id: event.subcategoryId },
    });
  }

  if (fields.includes("ticketTypes")) {
    result.ticketTypes = event.ticketTypes ?? await prisma.ticketType.findMany({
      where: { eventId: event.id },
    });
  }

  return result;
}