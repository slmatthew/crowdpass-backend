import { formatUser } from "@/api/utils/formatters";
import { privileges } from "@/api/utils/privileges";
import { UserService } from "@/services/userService";
import { Role } from "@prisma/client";
import { Request, Response } from "express";

export async function getUsers(req: Request, res: Response) {
  if(!privileges.users.get(req.user!)) return res.status(403).json({ message: "Нет доступа" });
  
  const { search, page = "1", pageSize = "20" } = req.query;

  const result = await UserService.getUsers({
    search: search as string | undefined,
    page: Number(page),
    pageSize: Number(pageSize),
  });

  res.json(result);
}

export async function promoteToAdmin(req: Request, res: Response) {
  if(!privileges.users.adminManage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const userId = Number(req.params.id);
  const { role, organizerId } = req.body;

  const admin = await UserService.promoteToAdmin(userId, role, organizerId);
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

  const user = await UserService.findUserById(id);

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
    const user = await UserService.forceUpdatePlatformId(Number(userId), targetPlatform, targetId);
    res.json(formatUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при обновлении ID платформы" });
  }
}