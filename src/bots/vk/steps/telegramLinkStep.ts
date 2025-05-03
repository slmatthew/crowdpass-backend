import { MessageContext } from 'vk-io';
import { UserService } from '@/services/userService';
import { prisma } from '@/db/prisma';
import { sendLinkRequest } from '@/bots/utils/sendLinkRequest';
import { Platform } from '@prisma/client';

export async function handleTelegramLinkStep(ctx: MessageContext) {
  const input = ctx.text?.trim().replace(/^@/, '');
  ctx.state.step = null;

  if (!input) return ctx.send('❌ Введи корректный Telegram username или ID.');

  try {
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ telegramId: input }],
      },
    });

    if (!targetUser?.telegramId) {
      return ctx.send('❌ Telegram-пользователь не найден.');
    }

    const { code } = await UserService.startLinkProcedure({
      sourceUserId: ctx.state.user.id,
      targetPlatform: Platform.TELEGRAM,
      targetIdentifier: targetUser.telegramId,
    });

    const res = await sendLinkRequest(Platform.TELEGRAM, targetUser.telegramId, code);
    console.log(res);

    await ctx.send('✅ Запрос отправлен. Подтверди его в Telegram.');
  } catch (err: any) {
    await ctx.send(`❌ Ошибка: ${err.message}`);
  }
}
