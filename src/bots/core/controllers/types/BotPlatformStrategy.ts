import { ControllerContext } from "@/bots/telegram/controllers/ControllerContext";
import { CallbackAction } from "../../constants/callbackActions";
import { ControllerResponse } from "./ControllerResponse";
import { MessageContext } from "vk-io";

/**
 * из-за различий в обработке payloads в телеграме и вконтакте
 * возникла необходимость создать врапперы как для обычных CallbackAction,
 * так и для тех, что хранят дополнительные параметры
 * 
 * telegram: string
 * vk: { action: string }
 */
export type CallbackActionFunction = (action: CallbackAction) => string | { action: string };
export type CallbackPayloadFunction = (...args: any[]) => string | { action: string };

type CallbackPayloads = Record<string, CallbackPayloadFunction>;

export interface BotPlatformStrategy<Context> {
  callbackAction: CallbackActionFunction;
  callbackPayloads: CallbackPayloads;

  doActionReply: (ctx: Context, result: ControllerResponse) => any;
}