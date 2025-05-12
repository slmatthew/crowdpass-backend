import { VK } from 'vk-io';
import { VkRouter } from './routers/router';
import { UserService } from '@/services/userService';
import { handleStart } from './commands/start';
import { handleFallback } from './handlers/fallbackHandler'
import { handleLinkConfirm } from './handlers/linkConfirmHandler';
import { StepRouter } from './routers/stepRouter';
import { handleLink } from './commands/link';
import { handleEvents } from './handlers/eventsHandler';
import { handleBookings } from './handlers/bookingsHandler';
import { bookingSessionService } from '../core/services/BookingSessionService';

const vk = new VK({
  token: process.env.VK_BOT_TOKEN!,
  pollingGroupId: Number(process.env.VK_BOT_ID!),
});

export async function startVkBot() {
  const router = new VkRouter();
  const stepRouter = new StepRouter();

  // === Регистрируем команды ===

  

  router.registerTextCommand('/start', handleStart);
  router.registerTextCommand('начать', handleStart);
  router.registerTextCommand('/link', handleLink);

  router.registerPayloadCommand('confirm_link', handleLinkConfirm);
  router.registerPayloadCommand('link_telegram', handleLink);

  handleEvents(router);
  handleBookings(router);

  router.setFallback(handleFallback);

  // === Middleware: загрузка пользователя ===

  vk.updates.use(async (ctx, next) => {
    const vkId = ctx.senderId?.toString();
    if (!vkId) return next();

    const [profile] = await vk.api.users.get({ user_ids: [vkId] });

    const user = await UserService.findOrCreateUser({
      vkId,
      firstName: profile.first_name,
      lastName: profile.last_name,
    });

    ctx.state.user = user;
    await next();
  });

  // === Обработка сообщений ===

  vk.updates.on('message_new', async (ctx) => {
    if(await stepRouter.handle(ctx)) return;

    await router.handle(ctx);
  });

  await vk.updates.start();
  console.log('🚀 VK bot running');
}

export { vk };