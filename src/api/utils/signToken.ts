import jwt from "jsonwebtoken";
import { SessionService } from "@/services/sessionService";

export interface TokenData {
  id: number;
  adm?: number;
  iat?: number;
  iss?: string;
  aud?: string;
}

export function signAccessToken(data: TokenData, expiresIn = '15m'): string {
  return jwt.sign(
    { ...data, iss: 'crowdpass', aud: 'user' },
    process.env.JWT_SECRET!,
    { expiresIn }
  );
}

export async function signRefreshToken(userId: number): Promise<string> {
  const refreshToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней

  await SessionService.create(userId, refreshToken, expiresAt);

  return refreshToken;
}