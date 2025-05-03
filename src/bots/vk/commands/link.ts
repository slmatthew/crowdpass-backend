import { KeyboardBuilder, MessageContext } from "vk-io";
import { UserService } from "@/services/userService";
import { Platform } from "@prisma/client";

export async function handleLink(ctx: MessageContext) {
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
    await ctx.send(`❌ Ошибка: ${err.message}`);
  }
}