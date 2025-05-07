import { Organizer } from "@prisma/client";
import { FormatOptions } from "./formatOptions";
import { OrganizerService } from "../../../services/organizerService";

export interface OrganizerFormat extends Organizer {
  admins?: number[];
};

export async function formatOrganizer(organizer: Organizer, options: FormatOptions = {}) {
  const { extended, fields = [] } = options;

  const result: OrganizerFormat = {
    id: organizer.id,
    name: organizer.name,
    description: organizer.description,
    contacts: organizer.contacts,
  };

  if(extended && fields.includes("admins")) {
    const admins = await OrganizerService.getOrganizerAdmins(organizer.id);
    result.admins = admins.map(admin => admin.userId);
  }

  return result;
}