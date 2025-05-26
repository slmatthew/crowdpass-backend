import { Prisma } from "@prisma/client";

export const userAdmin = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: {
    admin: true,
  },
});

export type UserAdmin = Prisma.UserGetPayload<
  typeof userAdmin
>;