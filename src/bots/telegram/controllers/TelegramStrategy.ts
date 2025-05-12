import { BotPlatformStrategy } from "@/bots/core/controllers/types/BotPlatformStrategy";

import { CallbackAction } from "@/bots/core/constants/callbackActions";
import { callbackPayloads } from "@/bots/core/utils/callbackPayloads";

import { ControllerContext } from "./ControllerContext";
import { ControllerResponse, ActionReply } from "@/bots/core/controllers/types/ControllerResponse";
import { InlineKeyboard } from "grammy";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { convertKeyboard } from "../utils/convertKeyboard";

export const TelegramStrategy: BotPlatformStrategy<ControllerContext> = {
  callbackAction: (action: CallbackAction): string => action,
  callbackPayloads,
  
  async doActionReply(ctx: ControllerContext, result: ControllerResponse) {
    const action = result.action as ActionReply;
  
    try {
      await ctx.answerCallbackQuery(action.isNotify ? action.text.plain : undefined);
    } catch(err) {}
  
    const text = action.text.markdown ?? action.text.plain;
  
    if(!result.ok) {
      try { await ctx.editMessageText(text, extraGoToHomeKeyboard); }
      catch(err) { await ctx.reply(text, extraGoToHomeKeyboard); }
  
      return;
    }
  
    const reply_markup: InlineKeyboard | undefined = action.keyboard ? convertKeyboard(action.keyboard) as InlineKeyboard : undefined;
  
    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup }); }
    catch(err) { await ctx.reply(text, { parse_mode: 'Markdown', reply_markup }); }
  },
};