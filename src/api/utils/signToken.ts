import jwt from "jsonwebtoken";

export interface TokenData {
  id: number;    // user id
  role: string;  // user role
  oid?: number;  // user organizer id
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
    role: data.role,
    oid: data.oid,
    iat: Math.floor(Date.now() / 1000),
    iss: data.iss || 'crowdpass',
    aud: data.aud || 'web-panel',
  };

  return jwt.sign(
    tokenData,
    process.env.JWT_SECRET!,
    { expiresIn }
  );
}