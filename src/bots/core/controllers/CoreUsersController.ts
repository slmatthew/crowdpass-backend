import { CoreController } from "./CoreController";
import { PlatformContext, PlatformPayloads } from "./types/BotPlatformStrategy";
import { isRootSetupActive, attemptClaimRoot } from "@/utils/checkRoot";
import { UserService } from "@/services/userService";
import { ControllerResponse } from "./types/ControllerResponse";
import { KeyboardBuilder } from "../ui/KeyboardBuilder";
import { User } from "@prisma/client";

export class CoreUsersController<C extends PlatformContext, P extends PlatformPayloads> extends CoreController<C, P> {
  async rootPurpose(user: User, code: string): Promise<ControllerResponse> {
    console.log(isRootSetupActive())
    if(!isRootSetupActive()) return this.badResult('❌ Доступ запрещён');
    if(!attemptClaimRoot(code)) return this.badResult('Неверный код');

    await UserService.makeRoot(user.id);

    return {
      ok: true,
      action: {
        text: { plain: 'Вы назначены ROOT администратором' },
        keyboard: new KeyboardBuilder().inline().callbackButton('Главное меню', this.GO_HOME_CALLBACK).build(),
      },
    };
  }
}