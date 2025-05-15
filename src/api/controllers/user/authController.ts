import { signToken } from "@/api/utils/signToken";
import { UserService } from "@/services/userService";
import { parse, validate } from "@telegram-apps/init-data-node";
import { Request, Response } from "express";

export async function tma(req: Request, res: Response) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Необходимы данные из Telegram" });
  }

  const headerContent = authHeader.split(" ");
  if(headerContent[0] !== 'tma' || !headerContent[1]) {
    return res.status(400).json({ message: "Неверные параметры авторизации" });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const initData = headerContent[1];

  try {
    validate(initData, botToken);

    const parsed = parse(initData);
    if(!parsed.user) throw new Error('initData invalid');

    const user = await UserService.findUserByPlatformId('TELEGRAM', parsed.user.id.toString(), true);
    if(!user) throw new Error('User not found');

    const token = signToken({
      id: user.id,
      adm: user.admin?.id ?? undefined,
      aud: 'tma',
    });

    res.json({ token });
  } catch(err) {
    res.status(400).json({ message: 'Не удалось проверить данные' });
  }
}