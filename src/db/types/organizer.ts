import { Prisma } from "@prisma/client";

export const sharedOrganizer = Prisma.validator<Prisma.OrganizerDefaultArgs>()({
  include: {
    admins: {
      include: {
        user: true,
      },
    },
    events: {
      where: {
        endDate: {
          gte: new Date(),
        },
      },
      take: 3,
    },
  },
});

export type SharedOrganizer = Prisma.OrganizerGetPayload<
  typeof sharedOrganizer
>;