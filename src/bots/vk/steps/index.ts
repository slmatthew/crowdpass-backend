import { MessageContext } from 'vk-io';
import { handleTelegramLinkStep } from './telegramLinkStep';

export class StepRouter {
  async handle(ctx: MessageContext) {
    switch (ctx.state.step) {
      case 'awaiting_telegram_id':
        return handleTelegramLinkStep(ctx);
    }

    return false;
  }
}