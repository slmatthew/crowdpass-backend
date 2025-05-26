import { Organizer } from "@prisma/client";

export type XOrganizerShort = {
  id: number;
  name: string;
  slug: string | null;
};

export type XOrganizer = Organizer;