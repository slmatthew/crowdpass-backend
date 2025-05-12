import { BotPlatformStrategy } from "@/bots/core/controllers/types/BotPlatformStrategy";

import { CallbackAction } from "@/bots/core/constants/callbackActions";
import { CallbackPayloadsObject } from "@/bots/core/controllers/types/CallbackPayloadsTypes";
import { callbackPayloads } from "../utils/callbackPayloads";

import { KeyboardBuilder, MessageContext } from "vk-io";
import { ControllerResponse, ActionReply } from "@/bots/core/controllers/types/ControllerResponse";
import { convertKeyboard } from "../utils/convertKeyboard";

export const VkStrategy: BotPlatformStrategy<MessageContext, CallbackPayloadsObject> = {
  callbackAction: (action: CallbackAction): { action: string } => ({ action }),
  callbackPayloads,

  async doActionReply(ctx: MessageContext, result: ControllerResponse) {
    const action = result.action as ActionReply;
    const text = action.text.plain;

    if(!result.ok) return await ctx.send(text);

    const keyboard = action.keyboard ? convertKeyboard(action.keyboard) as KeyboardBuilder : undefined;

    await ctx.send(text, { keyboard });
  },
};