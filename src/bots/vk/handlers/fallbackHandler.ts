import { MessageContext } from 'vk-io';

export async function handleFallback(ctx: MessageContext) {
  await ctx.send('Я не понял, что ты хотел сделать 🤔 Попробуй ещё раз.');
}
