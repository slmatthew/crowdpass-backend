import crypto from "crypto";

export function verifyTelegramAuth(data: any, botToken: string): boolean {
  const secret = crypto.createHash('sha256').update(botToken).digest();
  const { hash, ...rest } = data;

  const sorted = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join("\n");

  const hmac = crypto.createHmac('sha256', secret).update(sorted).digest('hex');

  return hmac === hash;
}
