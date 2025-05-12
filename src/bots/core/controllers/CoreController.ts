import { CallbackAction } from "../constants/callbackActions";
import { AbstractKeyboard } from "../ui/abstractTypes";
import { KeyboardBuilder } from "../ui/KeyboardBuilder";
import { BotPlatformStrategy, PlatformContext, PlatformPayloads } from "./types/BotPlatformStrategy";
import { ActionReply, ControllerResponse } from "./types/ControllerResponse";

export class CoreController<C extends PlatformContext, P extends PlatformPayloads> {
  protected readonly GO_HOME_CALLBACK: string | { action: string };
  protected readonly GO_HOME_KEYBOARD: AbstractKeyboard;

  constructor(protected strategy: BotPlatformStrategy<C, P>) {
    this.GO_HOME_CALLBACK = strategy.callbackAction(CallbackAction.GO_HOME);
    this.GO_HOME_KEYBOARD = new KeyboardBuilder()
      .inline()
      .callbackButton('Главное меню', this.GO_HOME_CALLBACK)
      .build();
  }

  protected badResult(plain: string, markdown?: string, goHomeKeyboard: boolean = false): ControllerResponse {
    return {
      ok: false,
      action: {
        text: { plain, markdown },
        keyboard: goHomeKeyboard ? this.GO_HOME_KEYBOARD : undefined,
      }
    };
  }

  protected goodActionReply(text: ActionReply['text'], isNotify: boolean = false, keyboard?: ActionReply['keyboard']): ControllerResponse {
    return {
      ok: true,
      action: {
        text,
        isNotify,
        keyboard
      } as ActionReply,
    };
  }
}