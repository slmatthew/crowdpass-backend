import { InlineKeyboard } from "grammy";
import { CallbackAction } from "../constants/callbackActions";

export const extraGoToHomeKeyboard: any = {
  reply_markup: new InlineKeyboard().text('Главное меню', CallbackAction.GO_HOME),
};