import { UserAdmin } from "@/db/types";
import { Admin, Role, User } from "@prisma/client";

function escapePhone(phone: string): string {
  const phoneLength = phone.length;

  let result = '';
  result += phone.slice(0, 1);
  result += '*'.repeat(phoneLength - 5);
  result += phone.slice(phoneLength - 4);

  return result;
}

export const formatUser = {
  safe: (user: User): Omit<User, 'isBanned' | 'bannedAt'> => {
    const result = {
      id: user.id,
      telegramId: user.telegramId,
      vkId: user.vkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    if(user.phone) {
      result.phone = escapePhone(user.phone);
    }

    return result;
  },
  admin: <T extends UserAdmin>(user: T): User & { admin?: { role: Role; organizerId: number | null; } } => {
    const result = {
      ...user,
      phone: user.phone ? escapePhone(user.phone) : null,
      admin: user.admin ? {
        role: user.admin.role,
        organizerId: user.admin.organizerId,
      } : undefined,
    };

    return result;
  },
};