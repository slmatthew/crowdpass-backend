import { prisma } from "../db/prisma";

export async function getAdminAvailableOrganizers(organizerId: number | null = null, include : object = {}) {
  if(organizerId !== null) {
    return await prisma.organizer.findMany({
      where: {
        id: organizerId,
      },
      include,
    });
  }

  return await prisma.organizer.findMany({ include });
}

export async function getOrganizerAdmins(organizerId: number, includeUser: boolean = false) {
  return await prisma.admin.findMany({
    where: {
      organizerId,
    },
    include: {
      user: includeUser,
    },
  });
}