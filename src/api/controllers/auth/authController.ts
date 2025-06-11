import { signAccessToken, signRefreshToken } from '@/api/utils/signToken';
import { SessionService } from '@/services/sessionService';
import { Request, Response } from 'express';

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if(!refreshToken) return res.status(400).json({ message: "Отсутствует refresh token" });

  const session = await SessionService.findByRefreshToken(refreshToken);

  if(!session || session.expiresAt < new Date()) {
    return res.status(401).json({ message: "Недействительный или истёкший refresh token" });
  }

  const userId = session.userId;

  const accessToken = signAccessToken({ id: userId });
  const newRefreshToken = await signRefreshToken(userId);

  await SessionService.delete(session.id);

  res.json({ accessToken, refreshToken: newRefreshToken });
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if(!refreshToken) return res.status(400).json({ message: "Отсутствует refresh token" });

  const session = await SessionService.findByRefreshToken(refreshToken);
  if(!session) return res.status(400).json({ message: "Cессия просрочена" });

  await SessionService.deleteByUserId(session.userId);
  res.json({ message: "Выход выполнен" });
}

export { TelegramAuth } from './telegramAuthController';
export * as vkAuth from './vkAuthController';