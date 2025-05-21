import { User } from "@prisma/client";

export function formatUser(user: User) {
  const result = {
    id: user.id,
    telegramId: user.telegramId,
    vkId: user.vkId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    createdAt: user.createdAt,
  };

  if(user.phone) {
    const phoneLength = user.phone.length;

    let phone = '';
    phone += user.phone.slice(0, 1);
    phone += '*'.repeat(phoneLength - 5);
    phone += user.phone.slice(phoneLength - 4);

    result.phone = phone;
  }

  return result;
}