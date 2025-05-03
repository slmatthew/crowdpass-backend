import { formatUser } from "@/api/utils/formatters";
import { UserService } from "@/services/userService";
import { Request, Response } from "express";

export async function getUserById(req: Request, res: Response) {
  const id = Number(req.params.id);
  //const { extended, fields } = req.query;

  const user = await UserService.findUserById(id);

  if (!user) return res.status(404).json({ message: "Пользователь не найден" });

  res.json(formatUser(user));
}

export async function changePlatformId(req: Request, res: Response) {
  const { userId, targetPlatform, targetId } = req.body;

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