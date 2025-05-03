import { InlineKeyboard } from "grammy";

export const extraGoToHomeKeyboard: any = {
  reply_markup: new InlineKeyboard().text('Главное меню', 'go_to_home')
};