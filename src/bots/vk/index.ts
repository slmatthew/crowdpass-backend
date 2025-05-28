import { VK } from 'vk-io';
import { VkRouter } from './routers/router';
import { UserService } from '@/services/user.service';
import { handleFallback } from './handlers/fallbackHandler'
import { StepRouter } from './routers/stepRouter';
import { handleEvents } from './handlers/eventsHandler';
import { handleBookings } from './handlers/bookingsHandler';
import { handleProfile } from './handlers/profileHandler';
import { handleNavigation } from './handlers/navigationHandler';
import { handleTickets } from './handlers/ticketsHandler';

const vk = (() => {
  try {
    const vkApi = new VK({
      token: process.env.VK_BOT_TOKEN!,
      pollingGroupId: Number(process.env.VK_BOT_ID!),
    });

    return vkApi;
  } catch(err) {
    return null as unknown as VK;
  }
})();

export async function startVkBot() {
  if(!process.env.VK_BOT_TOKEN || process.env.VK_BOT_TOKEN.length === 0) {
    console.warn('⚠️ VK bot token was not provided');
    return;
  }

  const router = new VkRouter();
  const stepRouter = new StepRouter();

  // === Регистрируем команды ===

  handleNavigation(router);
  handleEvents(router);
  handleBookings(router);
  handleTickets(router);
  handleProfile(router);

  router.setFallback(handleFallback);

  // === Middleware: загрузка пользователя ===

  vk.updates.use(async (ctx, next) => {
    const vkId = ctx.senderId?.toString();
    if (!vkId) return next();

    const [profile] = await vk.api.users.get({ user_ids: [vkId] });

    const user = await UserService.findOrCreate({
      vkId,
      firstName: profile.first_name,
      lastName: profile.last_name,
    });

    ctx.state.user = user;
    await next();
  });

  // === Обработка сообщений ===

  vk.updates.on('message_new', async (ctx) => {
    if(ctx.state.user.isBanned) return ctx.send('Вы заблокированы');

    if(await stepRouter.handle(ctx)) return;

    await router.handle(ctx);
  });

  await vk.updates.start();
  console.log('🚀 VK bot running');
}

export { vk };