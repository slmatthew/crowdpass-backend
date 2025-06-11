import jwt, { SignOptions } from "jsonwebtoken";
import { SessionService } from "@/services/sessionService";

export interface TokenData {
  id: number;
  adm?: number;
  iat?: number;
  iss?: string;
  aud?: string;
}

export function signAccessToken(data: TokenData, expiresIn: SignOptions['expiresIn'] = '15m'): string {
  const secret = process.env.JWT_SECRET;
  if(!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }

  const options: SignOptions = { expiresIn: expiresIn };

  return jwt.sign(
    { ...data, iss: 'crowdpass', aud: 'user' },
    secret,
    options
  );
}

export async function signRefreshToken(userId: number): Promise<string> {
  const refreshToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней

  await SessionService.create(userId, refreshToken, expiresAt);

  return refreshToken;
}