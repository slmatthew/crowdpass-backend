import jwt from "jsonwebtoken";

export interface TokenData {
  id: number;
  adm?: number;
  iat?: number;
  iss?: string;
  aud?: string;
}

export function signToken(
  data : TokenData,
  expiresIn : string = '2h'
): string {
  const tokenData : TokenData = {
    id: data.id,
    adm: data.adm,
    iat: Math.floor(Date.now() / 1000),
    iss: data.iss || 'crowdpass',
    aud: data.aud || 'unknown',
  };

  return jwt.sign(
    tokenData,
    process.env.JWT_SECRET!,
    { expiresIn }
  );
}