import { MessageContext } from 'vk-io';
import { mainMenuKeyboard } from '../markups/mainMenu';

export async function handleFallback(ctx: MessageContext) {
  await ctx.send('Я не понял, что ты хотел сделать 🤔 Попробуй ещё раз.', { keyboard: mainMenuKeyboard });
}
