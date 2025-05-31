import { Admin, Platform, Role, User } from "@prisma/client";
import { prisma } from "../db/prisma";
import { randomUUID } from "crypto";
import { CommonError, CommonErrorCodes } from "@/types/errors/CommonError";

export const UserErrorCodes = {
  USER_ALREADY_LINKED: "U-C001",
  LINK_CODE_INVALID: "U-C002",

  USER_ALREADY_PROMOTED: "U-C003",
  USER_ALREADY_DEMOTED: "U-C004",
} as const;

export class UserError extends CommonError {
  code: string;
  metadata?: any;

  constructor(code: string, message: string, metadata?: any) {
    super(code, message, metadata);
    this.name = "UserError";
    this.code = code;
    this.metadata = metadata;
  }
}

export type UserAdmin = User & { admin: Admin | null };
export type AdminUser = Admin & { user: User };

export type UserUpdateData = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'bannedAt'>>;

export class UserService {
  /* finders */

  /**
   * Возвращает существующего или создает нового пользователя
   *
   * @param user - Информация о пользователе
   *   - `telegramId` (optional): Telegram ID. Обязателен, если не указан vkId
   *   - `vkId` (optional): ID ВКонтакте. Обязателен, если не указан telegramId
   *   - `firstName`: Имя
   *   - `lastName`: Фамилия
   *   - `phone` (optional): Номер телефона
   *   - `email` (optional): Электронная почта
   * @returns Promise<UserAdmin>
   * @throws {UserError} В случае, если ни указан ни telegramId, ни vkId
   */
  static async findOrCreate(user: {
    telegramId?: string;
    vkId?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  }): Promise<UserAdmin> {
    if(!user.telegramId && !user.vkId) throw new UserError(CommonErrorCodes.INVALID_PARAMS, 'You must provide telegram or vk id');

    const existing: UserAdmin | null = await prisma.user.findFirst({
      where: {
        OR: [
          { telegramId: user.telegramId ?? undefined },
          { vkId: user.vkId ?? undefined },
        ],
      },
      include: {
        admin: true,
      },
    });
  
    if(existing) return existing;
  
    const created: Omit<UserAdmin, 'admin'> = await prisma.user.create({ data: user });
    const result: UserAdmin = { ...created, admin: null };

    return result;
  }

  static async findById(id: number): Promise<UserAdmin | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        admin: true,
      },
    });
  }

  static async findByPlatformId(platform: Platform, platformId: string, includeAdmin: boolean = false): Promise<UserAdmin | null> {
    const where = platform === Platform.TELEGRAM ? { telegramId: platformId } : { vkId: platformId };
    const include = includeAdmin ? { admin: true } : {};

    return prisma.user.findUnique({ where, include });
  }

  /* paginator for AP */

  static async getUsers({
    search,
    page = 1,
    pageSize = 20,
  }: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: UserAdmin[];
    total: number;
  }> {
    const skip = (page - 1) * pageSize;
    
    let id: number | undefined = undefined;

    try {
      const parsed = Number(search);
      if (
        Number.isSafeInteger(parsed) &&
        parsed >= -2147483648 &&
        parsed <= 2147483647
      ) {
        id = parsed;
      }
    } catch {}

    const where = search
      ? {
          OR: [
            { id },
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

  /* проверка на существование root-пользователя */

  static async rootExists(): Promise<boolean> {
    const root = await prisma.admin.findFirst({ where: { role: 'ROOT' } });

    return !!root;
  }

  static async rootPurpose(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if(!user) throw new UserError(CommonErrorCodes.USER_NOT_FOUND, 'Пользователь не найден');

    return prisma.admin.create({
      data: {
        userId: id,
        role: 'ROOT',
      }
    });
  }

  /* процедура слияния аккаунтов */
  
  static async startLinkProcedure(params: {
    sourceUserId: number;
    targetPlatform: Platform;
    targetIdentifier?: string;
  }) {
    const { sourceUserId, targetPlatform, targetIdentifier } = params;
  
    const sourceUser = await prisma.user.findUnique({ where: { id: sourceUserId } });
    if(!sourceUser) {
      throw new UserError(CommonErrorCodes.USER_NOT_FOUND, "Пользователь не найден. Вы должны быть зарегистрированы в боте VK перед началом процедуры");
    }

    if(sourceUser.isBanned) throw new UserError(CommonErrorCodes.USER_BANNED, 'Пользователь заблокирован');
  
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
  
    if(targetIdentifier) {
      targetUser = await prisma.user.findFirst({
        where:
          targetPlatform === Platform.TELEGRAM
            ? { telegramId: targetIdentifier }
            : { vkId: targetIdentifier },
      });
  
      if(!targetUser) {
        throw new UserError(CommonErrorCodes.USER_NOT_FOUND, "Пользователь для привязки не найден");
      }
  
      if(targetUser.id === sourceUserId) {
        throw new UserError(CommonErrorCodes.USER_INVALID_ID, "Нельзя связать аккаунт с самим собой");
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

  static async confirmLink(code: string, confirmingUserId?: number, keepUserId?: number) {
    const link = await prisma.accountLinkRequest.findUnique({
      where: { code },
      include: {
        source: true,
        target: true,
      },
    });
  
    if(!link || link.confirmed) {
      throw new UserError(UserErrorCodes.LINK_CODE_INVALID, "Код подтверждения недействителен или уже использован");
    }
  
    const source = link.source;
    let target = link.target;
  
    if(!target && confirmingUserId) {
      target = await prisma.user.findUnique({ where: { id: confirmingUserId } });
  
      if(!target) {
        throw new UserError(CommonErrorCodes.USER_NOT_FOUND, "Подтверждающий пользователь не найден");
      }

      await prisma.accountLinkRequest.update({
        where: { code },
        data: { targetId: confirmingUserId },
      });
    }
  
    if(!target) {
      throw new UserError(CommonErrorCodes.USER_NOT_FOUND, "Неизвестен второй аккаунт для связывания");
    }
  
    let mainUser, secondaryUser;
  
    if(keepUserId) {
      if(keepUserId !== source.id && keepUserId !== target.id) {
        throw new UserError(CommonErrorCodes.USER_NOT_FOUND, "Неверный ID пользователя для сохранения");
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
    if(!link) {
      throw new UserError(UserErrorCodes.LINK_CODE_INVALID, "Код подтверждения недействителен или уже использован");
    }
  
    await prisma.accountLinkRequest.delete({ where: { code } });
  
    return true;
  }

  static async forceUpdatePlatformId(userId: number, targetPlatform: Platform, targetId: string | null): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if(!user) {
      throw new UserError(CommonErrorCodes.USER_NOT_FOUND, "Пользователь не найден");
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

  /* обновление данных пользователя */

  static convertToSchema(user: User | UserAdmin): UserUpdateData {
    return {
      telegramId: user.telegramId ?? undefined,
      vkId: user.vkId ?? undefined,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      firstName: user.firstName,
      lastName: user.lastName,
      isBanned: user.isBanned,
    };
  }

  static async update(id: number, data: UserUpdateData): Promise<User> {
    const insert: any = data;
    if(data.isBanned) {
      insert.bannedAt = new Date();
    } else {
      insert.bannedAt = null;
    }

    return prisma.user.update({
      where: { id },
      data: insert,
    });
  }

  static async promoteAdmin(userId: number, role: "ADMIN" | "MANAGER", organizerId?: number): Promise<Admin> {
    const realOrganizerId = role === Role.ADMIN ? null : organizerId;

    const admin = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, include: { admin: true } });

      if(!user) throw new UserError(CommonErrorCodes.USER_NOT_FOUND, 'Пользователь не найден');
      if(user.admin) throw new UserError(UserErrorCodes.USER_ALREADY_PROMOTED, 'Пользователь уже является администратором', user.admin);
      if(user.isBanned) throw new UserError(CommonErrorCodes.USER_BANNED, 'Пользователь заблокирован', { bannedAt: user.bannedAt });

      return await tx.admin.create({
        data: { userId, role, organizerId: realOrganizerId },
      });
    });

    return admin;
  }

  static async demoteAdmin(userId: number): Promise<Admin> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, include: { admin: true } });

      if(!user) throw new UserError(CommonErrorCodes.USER_NOT_FOUND, 'Пользователь не найден');
      if(!user.admin) throw new UserError(UserErrorCodes.USER_ALREADY_PROMOTED, 'Пользователь уже является администратором', user.admin);

      return tx.admin.delete({ where: { id: user.admin.id } });
    });
  }
}