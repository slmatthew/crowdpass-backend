import { CoreBookingController } from "@/bots/core/controllers/CoreBookingsController";
import { VkStrategy } from "./VkStrategy";
import { MessageContext } from "vk-io";
import { BookingService } from "@/services/bookingService";
import { BookingError } from "@/types/errors/BookingError";

const controller = new CoreBookingController(VkStrategy);

const VK_PAYMENTS_LIVE = process.env.NODE_ENV !== 'development';

export async function sendMyBookings(ctx: MessageContext, page: number = 1) {
  const user = ctx.state.user;
  const result = await controller.sendMyBookings(user, page);
  VkStrategy.doActionReply(ctx, result);
}

export async function sendMyBookingPay(ctx: MessageContext, bookingId: number, page: number) {
  if(VK_PAYMENTS_LIVE) {
    return await ctx.send('❌ К сожалению, в данный момент оплата ВКонтакте недоступна');
  }

  const user = ctx.state.user;
  const booking = await BookingService.getById(bookingId);

  if(!booking || !user || booking.userId !== user.id) {
    await ctx.send('❌ Вы не можете оплатить это бронирование');
    return await sendMyBookings(ctx, page);
  }

  try {
    const res = await BookingService.payBooking(booking.id);

    BookingService.logBookingPaid(
      user.id,
      booking.id,
      {
        source: 'vk-bot',
        forced: false,
        amount: 0,
      }
    );
  
    if(res) await ctx.send('✅ Бронирование успешно оплачено');
    else await ctx.send('❌ Произошла ошибка при оплате бронирования');
  } catch(err) {
    if(err instanceof BookingError) {
      console.error(`[VK/sendMyBookingPay] ${err.code}: ${err.message}`);
      return await ctx.send(`❌ ${err.message}`);
    }

    console.error('[VK/sendMyBookingPay]', err);
    await ctx.send('❌ Произошла ошибка при оплате бронирования');
  } finally {
    await sendMyBookings(ctx, page);
  }
}

export async function sendMyBookingCancel(ctx: MessageContext, bookingId: number, page: number) {
  const user = ctx.state.user;
  const result = await controller.sendMyBookingCancel(user, bookingId, page);
  VkStrategy.doActionReply(ctx, result);
}

export async function sendBookingStart(ctx: MessageContext, eventId: number, fromPage: number, categoryId: number, subcategoryId: number) {
  const user = ctx.state.user;
  const result = await controller.sendBookingStart(user, eventId, fromPage, categoryId, subcategoryId);
  VkStrategy.doActionReply(ctx, result);
}

export async function sendBookingSelectType(ctx: MessageContext, ticketTypeId: number) {
  const user = ctx.state.user;
  const result = await controller.sendBookingSelectType(user, ticketTypeId);
  VkStrategy.doActionReply(ctx, result);
}

export async function sendBookingConfirm(ctx: MessageContext, userId: number) {
  const user = ctx.state.user;
  const result = await controller.sendBookingConfirm(user, userId);
  VkStrategy.doActionReply(ctx, result);
}

export async function sendBookingCancel(ctx: MessageContext, userId: number) {
  const user = ctx.state.user;
  const result = await controller.sendBookingCancel(user, userId);
  VkStrategy.doActionReply(ctx, result);
}