import { UserService } from "@/services/user.service";
import { UserError } from "@/types/errors/UserError";
import { Platform } from "@prisma/client";
import { KeyboardBuilder, MessageContext } from "vk-io";
import { mainMenuKeyboard } from "../markups/mainMenu";

export async function sendLink(ctx: MessageContext) {
  try {
    const { code, linkUrl } = await UserService.startLinkProcedure({
      sourceUserId: ctx.state.user.id,
      targetPlatform: Platform.TELEGRAM,
    });

    const keyboard = new KeyboardBuilder()
      .urlButton({ label: "✅ Подтвердить через Telegram", url: linkUrl })
      .inline();

    await ctx.send(`🧩 Для связывания аккаунтов нажми на кнопку ниже и подтверди действие в Telegram:\n\n${linkUrl}`, { keyboard });
  } catch (err: any) {
    await ctx.send(`❌ Ошибка: ${err.message}`, { keyboard: mainMenuKeyboard, });
  }
}

export async function sendLinkConfirm(ctx: MessageContext) {
  if(!ctx.messagePayload.code) return await ctx.send('Отсутствует код подтверждения');

  try {
    const user = await UserService.confirmLink(ctx.messagePayload.code);
    await ctx.send(`✅ Аккаунты успешно связаны.\nДобро пожаловать, ${user.firstName}!`, { keyboard: mainMenuKeyboard, });
  } catch(err) {
    if(err instanceof UserError) {
      console.error(`[vk/LinkCommand/${err.code}] ${err.message}`, err.metadata);
      await ctx.send(`❗ ${err.message}`, { keyboard: mainMenuKeyboard, });
    } else {
      console.error('[vk/LinkCommand]', err);
      await ctx.send('❗ Произошла ошибка, попробуйте позже', { keyboard: mainMenuKeyboard, });
    }
  }
}