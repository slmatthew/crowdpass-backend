import { FormatOptions } from "./formatOptions";
import { XEventConvert } from "@/api/types/responses/event";

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

export const formatEvent = {
  withPrice: XEventConvert.fromShared,
};