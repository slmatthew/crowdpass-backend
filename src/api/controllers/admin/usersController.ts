import { formatUser } from "@/api/utils/formatters";
import { privileges } from "@/api/utils/privileges";
import { UserService, UserUpdateData } from "@/services/user.service";
import { Role, User } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";

export async function getUsers(req: Request, res: Response) {
  if(!privileges.users.get(req.user!)) return res.status(403).json({ message: "Нет доступа" });
  
  const { search, page = "1", pageSize = "20" } = req.query;

  const result = await UserService.getUsers({
    search: search as string | undefined,
    page: Number(page),
    pageSize: Number(pageSize),
  });

  result.items = result.items.map(u => {
    if(u.phone) {
      const phoneLength = u.phone.length;

      let phone = '';
      phone += u.phone.slice(0, 1);
      phone += '*'.repeat(phoneLength - 5);
      phone += u.phone.slice(phoneLength - 4);

      u.phone = phone;
    }

    return u;
  });

  res.json(result);
}

export async function promoteToAdmin(req: Request, res: Response) {
  if(!privileges.users.adminManage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const userId = Number(req.params.id);
  const { role, organizerId } = req.body;

  const admin = await UserService.promoteAdmin(userId, role, organizerId);
  res.status(201).json(admin);
}

export async function demoteAdmin(req: Request, res: Response) {
  if(!privileges.users.adminManage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const userId = Number(req.params.id);

  if(userId === req.user?.id) return res.status(400).json({ message: "Нельзя разжаловать себя" });

  await UserService.demoteAdmin(userId);
  res.status(204).send();
}

export async function getUserById(req: Request, res: Response) {
  const id = Number(req.params.id);
  //const { extended, fields } = req.query;

  const user = await UserService.findById(id);

  if (!user) return res.status(404).json({ message: "Пользователь не найден" });

  res.json(formatUser(user));
}

export async function changePlatformId(req: Request, res: Response) {
  if(!privileges.users.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const userId = Number(req.params.id);
  const { targetPlatform, targetId } = req.body;

  if (!userId || !targetPlatform || !targetId) {
    return res.status(400).json({ message: "Параметры не указаны" });
  }

  try {
    const platform = targetPlatform === 'vk' ? 'VK' : 'TELEGRAM';
    const user = await UserService.forceUpdatePlatformId(Number(userId), platform, targetId);
    res.json(formatUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при обновлении ID платформы" });
  }
}

export async function resetPlatformId(req: Request, res: Response) {
  if(!privileges.users.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const userId = Number(req.params.id);
  const { targetPlatform } = req.body;

  if(!targetPlatform || (targetPlatform !== 'vk' && targetPlatform !== 'telegram')) {
    return res.status(400).json({ message: 'Неверно указана платформа', targetPlatform });
  }

  try {
    const user = await UserService.findById(userId);
    if(!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const platform = targetPlatform === 'vk' ? 'VK' : 'TELEGRAM';

    if(
      (targetPlatform === 'vk' && user.telegramId === null) ||
      (targetPlatform === 'telegram' && user.vkId === null)
    ) {
      return res.status(409).json({ message: `${platform} является единственной привязанной платформой пользователя` });
    }

    const uUser = await UserService.forceUpdatePlatformId(userId, platform, null);
    res.json(formatUser(uUser));
  } catch(err) {
    console.error(err)
    res.status(500).json({ message: 'Произошла ошибка' });
  }
}

const userUpdateInfoSchema = z.object({
  firstName: z.string().min(2),

  lastName: z
    .preprocess(val => val === "" ? undefined : val, z.string().min(2).optional()),

  email: z
    .preprocess(val => val === "" ? undefined : val, z.string().email().optional()),

  removePhone: z.boolean().optional(),
});

export async function updateInfo(req: Request, res: Response) {
  if(!privileges.users.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  try {
    const userId = Number(req.params.id);
    const validated = userUpdateInfoSchema.parse(req.body);

    const user: UserUpdateData = {
      firstName: validated.firstName,
      lastName: validated.lastName ?? '',
      email: validated.email,
      phone: validated.removePhone ? null : undefined,
    };

    const updated = await UserService.update(userId, user);

    res.json({ ok: !!updated });
  } catch(err: any) {
    console.error(err);

    if(err instanceof z.ZodError) {
      return res.status(400).json({ message: "Невалидные данные", errors: err.errors });
    }

    return res.status(500).json({ message: 'Произошла ошибка' });
  }
}

export async function banUnban(req: Request, res: Response) {
  if(!privileges.users.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  try {
    const userId = Number(req.params.id);

    if(userId === req.user?.id) return res.status(400).json({ message: 'Вы не можете заблокировать сами себя' });

    const user = await UserService.findById(userId);
    if(!user) return res.status(404).json({ message: 'Пользователь не найден' });

    if(user.admin && req.admin!.role !== 'ROOT')
      return res.status(403).json({ message: 'Вы не можете заблокировать другого администратора' });

    /**
     * предполагается, что первый пользователь в БД – это самый
     * главный администратор, поэтому используем hard code проверку
     * по идентификатору для блокировки других ROOT
     */
    if(user.admin && user.admin.role === 'ROOT' && req.admin!.role === 'ROOT' && req.user!.id !== 1)
      return res.status(403).json({ message: 'Вы не можете заблокировать другого ROOT-пользователя' });

    const updated = await UserService.update(user.id, { isBanned: !user.isBanned });
    return res.json(updated);
  } catch(err: any) {
    res.status(500).json({ message: 'Произошла ошибка' });
  }
}