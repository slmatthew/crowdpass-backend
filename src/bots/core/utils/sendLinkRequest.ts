import { Platform } from "@prisma/client";
import { vk } from "../../vk";
import { telegram } from "../../telegram";
import { InlineKeyboard } from "grammy";

export async function sendLinkRequest(platform: Platform, platformUserId: number|string, code: string) {
  if(platform === Platform.VK) {
    return await vk.api.messages.send({
      user_id: Number(platformUserId),
      random_id: Date.now(),
      message: `Кто-то пытается связать ваш VK аккаунт с Telegram.\nЕсли это вы — подтвердите слияние`,
      keyboard: JSON.stringify({
        buttons: [[{
          action: {
            type: 'text',
            label: '✅ Подтвердить',
            payload: JSON.stringify({ action: 'confirm_link', code }),
          },
          color: 'positive'
        }]]
      })
    });
  } else if(platform === Platform.TELEGRAM) {
    return await telegram.api.sendMessage(platformUserId, `Кто-то пытается связать ваш Telegram аккаунт с VK.\nЕсли это вы — подтвердите слияние`, {
      reply_markup: new InlineKeyboard().text('✅ Подтвердить', `confirm_link#${code}`),
    });
  } else return false;
}