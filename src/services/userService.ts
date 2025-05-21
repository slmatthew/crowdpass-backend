import { Admin, Platform, Role, User } from "@prisma/client";
import { prisma } from "../db/prisma";
import { randomUUID } from "crypto";
import { UserError, UserErrorCodes } from "@/types/errors/UserError";

type UserAdmin = User & { admin?: Admin };

interface UserUpdateData {
  firstName: string;
  email?: string | undefined;
  lastName?: string | undefined;
}

export class UserService {
  static async findOrCreateUser(data: {
    telegramId?: string;
    vkId?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  }): Promise<UserAdmin> {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { telegramId: data.telegramId ?? undefined },
          { vkId: data.vkId ?? undefined },
        ],
      },
      include: {
        admin: true,
      },
    });
  
    if(existing) return existing as UserAdmin;
  
    return prisma.user.create({ data });
  }

  static async findUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        admin: true,
      },
    });
  }

  static async findUserByPlatformId(platform: Platform, platformId: string, includeAdmin: boolean = false) {
    const where = platform === Platform.TELEGRAM ? { telegramId: platformId } : { vkId: platformId };
    const include = includeAdmin ? { admin: true } : {};

    return prisma.user.findUnique({ where, include });
  }

  static async getUsers({
    search,
    page = 1,
    pageSize = 20,
  }: {
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { id: Number(search).toString() === search ? Number(search) : -1 },
            { telegramId: search },
            { vkId: search },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { admin: true },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  static async promoteToAdmin(userId: number, role: "ADMIN" | "MANAGER", organizerId?: number) {
    const realOrganizerId = role === Role.ADMIN ? null : organizerId;

    return prisma.admin.create({
      data: { userId, role, organizerId: realOrganizerId },
    });
  }

  static async demoteAdmin(userId: number) {
    return prisma.admin.delete({
      where: { userId },
    });
  }

  static async forceUpdatePlatformId(userId: number, targetPlatform: Platform, targetId: string | null) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if(!user) {
      throw new UserError(UserErrorCodes.USER_NOT_FOUND, "Пользователь не найден");
    }
  
    if(targetPlatform === Platform.TELEGRAM) {
      return prisma.user.update({
        where: { id: userId },
        data: { telegramId: targetId },
      });
    } else if(targetPlatform === Platform.VK) {
      return prisma.user.update({
        where: { id: userId },
        data: { vkId: targetId },
      });
    } else {
      throw new Error(`Неизвестная платформа: ${targetPlatform}`);
    }
  }

  /**
   * Инициирует связывание аккаунтов: создает запрос и возвращает код подтверждения
   */
  static async startLinkProcedure(params: {
    sourceUserId: number;
    targetPlatform: Platform;
    targetIdentifier?: string; // ← теперь опционально
  }) {
    const { sourceUserId, targetPlatform, targetIdentifier } = params;
  
    const sourceUser = await prisma.user.findUnique({ where: { id: sourceUserId } });
    if (!sourceUser) {
      throw new UserError(UserErrorCodes.USER_NOT_FOUND, "Пользователь не найден. Вы должны быть зарегистрированы в боте VK перед началом процедуры");
    }
  
    if (
      (targetPlatform === Platform.VK && sourceUser.vkId !== null) ||
      (targetPlatform === Platform.TELEGRAM && sourceUser.telegramId !== null)
    ) {
      throw new UserError(
        UserErrorCodes.USER_ALREADY_LINKED,
        `Этот аккаунт уже связан с аккаунтом ${targetPlatform === Platform.TELEGRAM ? 'Telegram' : 'VK'}`,
        {
          targetPlatform,
          sourceUser: {
            userId: sourceUser.id,
            telegramId: sourceUser.telegramId,
            vkId: sourceUser.vkId,
          },
        }
      );
    }
  
    let targetUser = null;
  
    if (targetIdentifier) {
      targetUser = await prisma.user.findFirst({
        where:
          targetPlatform === Platform.TELEGRAM
            ? { telegramId: targetIdentifier }
            : { vkId: targetIdentifier },
      });
  
      if (!targetUser) {
        throw new UserError(UserErrorCodes.USER_NOT_FOUND, "Пользователь для привязки не найден");
      }
  
      if (targetUser.id === sourceUserId) {
        throw new UserError(UserErrorCodes.USER_INVALID_ID, "Нельзя связать аккаунт с самим собой");
      }
    }
  
    const code = randomUUID();
  
    await prisma.accountLinkRequest.create({
      data: {
        code,
        sourceId: sourceUserId,
        targetId: targetUser?.id,
        platform: targetPlatform,
      },
    });
  
    return {
      code,
      targetUser,
      linkUrl: targetPlatform === Platform.TELEGRAM
        ? `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=link_${code}`
        : `https://vk.com/im?sel=-${process.env.VK_BOT_ID}&msg=link_${code}`,
    };
  }  

  /**
   * Подтверждает связывание аккаунтов, обновляя один и удаляя второй
   */
  static async confirmLink(code: string, confirmingUserId?: number, keepUserId?: number) {
    const link = await prisma.accountLinkRequest.findUnique({
      where: { code },
      include: {
        source: true,
        target: true,
      },
    });
  
    if (!link || link.confirmed) {
      throw new UserError(UserErrorCodes.LINK_CODE_INVALID, "Код подтверждения недействителен или уже использован");
    }
  
    const source = link.source;
    let target = link.target;
  
    if (!target && confirmingUserId) {
      target = await prisma.user.findUnique({ where: { id: confirmingUserId } });
  
      if (!target) {
        throw new UserError(UserErrorCodes.USER_NOT_FOUND, "Подтверждающий пользователь не найден");
      }

      await prisma.accountLinkRequest.update({
        where: { code },
        data: { targetId: confirmingUserId },
      });
    }
  
    if (!target) {
      throw new UserError(UserErrorCodes.USER_NOT_FOUND, "Неизвестен второй аккаунт для связывания");
    }
  
    let mainUser, secondaryUser;
  
    if (keepUserId) {
      if (keepUserId !== source.id && keepUserId !== target.id) {
        throw new UserError(UserErrorCodes.USER_INVALID_ID, "Неверный ID пользователя для сохранения");
      }
      mainUser = keepUserId === source.id ? source : target;
      secondaryUser = mainUser.id === source.id ? target : source;
    } else {
      mainUser = source.createdAt <= target.createdAt ? source : target;
      secondaryUser = mainUser.id === source.id ? target : source;
    }
  
    return await prisma.$transaction(async (tx) => {
      await tx.accountLinkRequest.deleteMany({
        where: {
          OR: [
            { sourceId: secondaryUser.id },
            { targetId: secondaryUser.id },
          ],
        },
      });
  
      await tx.user.delete({ where: { id: secondaryUser.id } });

      const updated = await tx.user.update({
        where: { id: mainUser.id },
        data: {
          telegramId: mainUser.telegramId ?? secondaryUser.telegramId,
          vkId: mainUser.vkId ?? secondaryUser.vkId,
        },
      });
  
      return updated;
    });
  }

  static async cancelLink(code: string) {
    const link = await prisma.accountLinkRequest.findUnique({ where: { code } });
    if (!link) {
      throw new UserError(UserErrorCodes.LINK_CODE_INVALID, "Код подтверждения недействителен или уже использован");
    }
  
    await prisma.accountLinkRequest.delete({ where: { code } });
  
    return true;
  }

  static async rootExists(): Promise<boolean> {
    const root = await prisma.admin.findFirst({ where: { role: 'ROOT' } });

    return !!root;
  }

  static async makeRoot(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if(!user) throw Error("Invalid userId");

    return prisma.admin.create({
      data: {
        userId,
        role: 'ROOT',
      }
    });
  }

  static async setPhone(user: User, phone: string | null) {
    const userId = user.id;

    return prisma.user.update({
      where: { id: userId },
      data: { phone },
    });
  }

  static async update(userId: number, data: UserUpdateData) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}