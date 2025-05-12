import { CallbackAction } from "../../constants/callbackActions";
import { ControllerResponse } from "./ControllerResponse";
import { CallbackPayloadsObject, CallbackPayloadsString } from "./CallbackPayloadsTypes";

/**
 * из-за различий в обработке payloads в телеграме и вконтакте
 * возникла необходимость создать врапперы как для обычных CallbackAction,
 * так и для тех, что хранят дополнительные параметры
 * 
 * telegram: string
 * vk: { action: string }
 */
export type CallbackActionFunction = (action: CallbackAction) => string | { action: string };

export interface BotPlatformStrategy<Context, CallbackPayloadsType extends CallbackPayloadsObject | CallbackPayloadsString> {
  callbackAction: CallbackActionFunction;
  callbackPayloads: CallbackPayloadsType;

  doActionReply: (ctx: Context, result: ControllerResponse) => any;
}