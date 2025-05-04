import { VK } from 'vk-io';
import { VkRouter } from './router';
import { UserService } from '@/services/userService';
import { handleStart } from './commands/start';
import { handleFallback } from './handlers/fallbackHandler'
import { handleLinkConfirm } from './handlers/linkConfirmHandler';
import { StepRouter } from './stepRouter';
import { handleLink } from './commands/link';
import { handlePagination, handleEventDetails, handleShowQr } from './handlers/ticketHandlers';
import { handleEvents } from './commands/events';
import { handleBookingStart, handleTicketTypeSelect, handleBookingConfirm, handleBookingCancel } from './handlers/bookingHandlers';
import { sendBookingsPage } from './commands/bookings';
import { sendTicketsPage } from './commands/mytickets';

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

  router.registerTextPattern(/^\/?(events|мероприятия)(\s+(\d+))?$/i, (ctx, match) => {
    const page = match[3] ? Number(match[3]) : 1;
    return handleEvents(ctx, page);
  });  

  router.registerPayloadCommand('show_events', handleEvents);

  router.registerPayloadPattern(/^page_(\d+)$/, (ctx, match) =>
    handlePagination(ctx, Number(match[1]))
  );
  
  router.registerPayloadPattern(/^event_(\d+)_(\d+)$/, (ctx, match) =>
    handleEventDetails(ctx, Number(match[1]), Number(match[2]))
  );
  
  router.registerPayloadPattern(/^show_qr_(\d+)$/, (ctx, match) =>
    handleShowQr(ctx, Number(match[1]))
  );

  router.registerPayloadPattern(/^book_(\d+)_(\d+)$/, (ctx, m) =>
    handleBookingStart(ctx, Number(m[1]), Number(m[2]))
  );
  
  router.registerPayloadPattern(/^selectType_(\d+)$/, (ctx, m) =>
    handleTicketTypeSelect(ctx, Number(m[1]))
  );
  
  router.registerPayloadPattern(/^confirm_booking_(\d+)$/, (ctx, m) =>
    handleBookingConfirm(ctx, m[1])
  );
  
  router.registerPayloadPattern(/^cancel_booking_(\d+)$/, (ctx, m) =>
    handleBookingCancel(ctx, m[1])
  );

  router.registerPayloadCommand("my_bookings", (ctx) =>
    sendBookingsPage(ctx, 1)
  );
  
  router.registerPayloadPattern(/^mybookings_page_(\d+)$/, (ctx, m) =>
    sendBookingsPage(ctx, Number(m[1]))
  );  

  router.registerPayloadCommand("my_tickets", sendTicketsPage);

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