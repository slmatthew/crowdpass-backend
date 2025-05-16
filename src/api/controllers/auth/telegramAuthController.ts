import { Request, Response } from "express";
import { verifyTelegramAuth } from "@/api/utils/verifyTelegramAuth";
import { signAccessToken, signRefreshToken } from "@/api/utils/signToken";
import { logAction } from "@/utils/logAction";
import { UserService } from "@/services/userService";
import { parse, validate } from "@telegram-apps/init-data-node";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export class TelegramAuth {
  static async callback(req: Request, res: Response) {
    const data = req.query;

    if (!verifyTelegramAuth(data, TELEGRAM_BOT_TOKEN)) {
      return res.status(403).json({ message: "Проверка Telegram-подписи не пройдена." });
    }

    if(!data.id) {
      return res.status(400).json({ message: 'Не удалось найти ID' });
    }

    try {
      const user = await UserService.findUserByPlatformId('TELEGRAM', data.id.toString(), true);

      if (!user || !user.admin) {
        return res.status(403).json({ message: "Нет доступа." });
      }

      const accessToken = signAccessToken({
        id: user.id,
        adm: user.admin.id,
        aud: 'web-panel',
      });

      const refreshToken = await signRefreshToken(user.id);

      await logAction({
        actorId: user.id,
        action: "ap.auth.telegram",
        targetType: "user",
        targetId: user.id,
      });

      res.redirect(`${process.env.AP_BASE_URI}/login/telegram?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    } catch (error) {
      console.error("Ошибка Telegram авторизации:", error);
      res.status(500).json({ message: "Ошибка авторизации через Telegram." });
    }
  }

  static async miniApp(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: "Необходимы данные из Telegram" });
    }

    const headerContent = authHeader.split(" ");
    if(headerContent[0] !== 'tma' || !headerContent[1]) {
      return res.status(400).json({ message: "Неверные параметры авторизации" });
    }

    const initData = headerContent[1];

    try {
      validate(initData, TELEGRAM_BOT_TOKEN);

      const parsed = parse(initData);
      if(!parsed.user) throw new Error('initData invalid');

      const user = await UserService.findUserByPlatformId('TELEGRAM', parsed.user.id.toString(), true);
      if(!user) throw new Error('User not found');

      const accessToken = signAccessToken({
        id: user.id,
        adm: user.admin?.id ?? undefined,
        aud: 'tma',
      });
      
      const refreshToken = await signRefreshToken(user.id);

      res.json({ accessToken, refreshToken });
    } catch(err) {
      res.status(400).json({ message: 'Не удалось проверить данные' });
    }
  }
}