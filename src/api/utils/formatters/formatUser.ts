import { User } from "@prisma/client";

export function formatUser(user: User) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    vkId: user.vkId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}