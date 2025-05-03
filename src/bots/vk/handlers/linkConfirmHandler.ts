import { UserService } from '@/services/userService';
import { UserError } from '@/types/errors/UserError';
import { MessageContext } from 'vk-io';

export async function handleLinkConfirm(ctx: MessageContext) {
  if(!ctx.messagePayload.code) return await ctx.send('Отсутствует код подтверждения');

  try {
    const user = await UserService.confirmLink(ctx.messagePayload.code);
    await ctx.send(`✅ Аккаунты успешно связаны.\nДобро пожаловать, ${user.firstName}!`);
  } catch(err) {
    if(err instanceof UserError) {
      console.error(`[vk/LinkCommand/${err.code}] ${err.message}`, err.metadata);
      await ctx.send(`❗ ${err.message}`);
    } else {
      console.error('[vk/LinkCommand]', err);
      await ctx.send('❗ Произошла ошибка, попробуйте позже');
    }
  }
}
