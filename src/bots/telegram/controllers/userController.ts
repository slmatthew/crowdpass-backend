import { UserService } from "@/services/user.service";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { ControllerContext } from "./ControllerContext";

export async function setPhone(ctx: ControllerContext) {
  if(!ctx.sfx.user) return ctx.reply('❌ Не удалось получить информацию о пользователе', extraGoToHomeKeyboard);
  if(!ctx.update.message?.contact) return ctx.reply('❌ Отсутствует номер телефона', extraGoToHomeKeyboard);
  
  const { contact } = ctx.update.message;
  if(contact.user_id !== Number(ctx.sfx.user.telegramId)) return ctx.reply('❌ Отправьте свой номер телефона', extraGoToHomeKeyboard);

  const phone = contact.phone_number.startsWith('+', 0) ? contact.phone_number.slice(1) : contact.phone_number;

  await UserService.update(ctx.sfx.user.id, { phone: contact.phone_number });
  await ctx.reply('✅ Вы обновили свой номер телефона', extraGoToHomeKeyboard);
}