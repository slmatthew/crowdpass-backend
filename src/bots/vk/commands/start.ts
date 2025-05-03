import { getMainMenuKeyboard } from '../markups/mainMenu';
import { MessageContext } from 'vk-io';

export async function handleStart(ctx: MessageContext) {
  const user = ctx.state.user;
  await ctx.send({
    message: `Привет, ${user.firstName} 👋\nЧто ты хочешь сделать?`,
    keyboard: getMainMenuKeyboard(),
  });
}
