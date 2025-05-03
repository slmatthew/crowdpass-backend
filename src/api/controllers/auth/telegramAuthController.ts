import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { verifyTelegramAuth } from "../../utils/verifyTelegramAuth";
import { logAction } from "../../../utils/logAction";
import { signToken } from "../../utils/signToken";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const JWT_SECRET = process.env.JWT_SECRET!;

export async function telegramCallback(req: Request, res: Response) {
  const data = req.query;

  if (!verifyTelegramAuth(data, TELEGRAM_BOT_TOKEN)) {
    return res.status(403).json({ message: "Проверка Telegram-подписи не пройдена." });
  }

  if(!data.id) {
    return res.status(400).json({ message: 'Не удалось найти ID' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: data.id.toString() },
      include: { admin: true },
    });

    if (!user || !user.admin) {
      return res.status(403).json({ message: "Нет доступа." });
    }

    const token = signToken({
      id: user.id,
      role: user.admin.role,
      oid: user.admin.organizerId || undefined
    });

    await logAction({
      actorId: user.id,
      action: "ap.auth.telegram",
      targetType: "user",
      targetId: user.id,
    });

    res.redirect(`${process.env.AP_BASE_URI}/login/telegram?token=${token}`);
  } catch (error) {
    console.error("Ошибка Telegram авторизации:", error);
    res.status(500).json({ message: "Ошибка авторизации через Telegram." });
  }
}