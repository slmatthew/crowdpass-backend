import { MessageContext } from 'vk-io';
import { getMainMenuKeyboard } from '../markups/mainMenu';

export async function handleFallback(ctx: MessageContext) {
  await ctx.send('Я не понял, что ты хотел сделать 🤔 Попробуй ещё раз.', { keyboard: getMainMenuKeyboard() });
}
