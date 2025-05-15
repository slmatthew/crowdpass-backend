import { CoreBookingController } from "@/bots/core/controllers/CoreBookingsController";
import { TelegramStrategy } from "./TelegramStrategy";
import { ControllerContext } from "./ControllerContext";
import { InlineKeyboard } from "grammy";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { BookingService } from "@/services/bookingService";
import { SharedContext } from "@/types/grammy/SessionData";
import { currencyCache } from "../utils/currencyCache";
import { formatAmount } from "../utils/formatAmount";

const TELEGRAM_PAYMENTS_LIVE = process.env.NODE_ENV !== 'development';
const TELEGRAM_PAYMENTS_TOKEN = TELEGRAM_PAYMENTS_LIVE ? process.env.TELEGRAM_PAYMENTS_LIVE_TOKEN : process.env.TELEGRAM_PAYMENTS_TEST_TOKEN;

const controller = new CoreBookingController(TelegramStrategy);

export async function sendMyBookings(ctx: ControllerContext, page: number = 1) {
  const user = ctx.sfx.user!;
  const result = await controller.sendMyBookings(user, page);
  TelegramStrategy.doActionReply(ctx, result);
}

export async function sendMyBookingPaySimple(ctx: ControllerContext, bookingId: number, page: number) {
  if(TELEGRAM_PAYMENTS_LIVE) {
    try {
      await ctx.answerCallbackQuery('❌ Недоступно');
    } catch(err) {
      await ctx.reply('❌ Недоступно');
    }
    return;
  }

  const user = ctx.sfx.user!;
  const booking = await BookingService.getById(bookingId);

  if(!booking || !user || booking.userId !== user.id) {
    try {
      await ctx.answerCallbackQuery('❌ Вы не можете оплатить это бронирование');
    } catch(err) {}
    return await sendMyBookings(ctx, page);
  }

  const res = await BookingService.payBooking(booking.id);
  
  try {
    if(res) {
      await ctx.answerCallbackQuery('✅ Бронирование успешно оплачено');
      await sendMyBookings(ctx, page);
    } else {
      await ctx.answerCallbackQuery('❌ Произошла ошибка при оплате бронирования');
      await sendMyBookings(ctx, page);
    }
  } catch(err) {
    if(res) {
      await ctx.reply('✅ Бронирование успешно оплачено');
      await sendMyBookings(ctx, page);
    } else {
      await ctx.reply('❌ Произошла ошибка при оплате бронирования');
      await sendMyBookings(ctx, page);
    }
  }
}

export async function sendMyBookingPay(ctx: ControllerContext, bookingId: number, page: number) {
  const user = ctx.sfx.user!;
  const booking = await BookingService.getById(bookingId);

  const keyboard = new InlineKeyboard().text('Вернуться к бронированиям', TelegramStrategy.callbackPayloads.myBookingsPage(page));

  const reject = async (text: string) => {
    try {
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(text, { reply_markup: keyboard });
    } catch(err) {
      await ctx.reply(text, { reply_markup: keyboard });
    }
  };

  if(!booking || booking.userId !== user.id || booking.status !== "ACTIVE") {
    await reject("❌ Вы не можете оплатить это бронирование");
    return;
  }

  if(booking.bookingTickets.length === 0) {
    await reject("❌ Это бронирование нельзя оплатить");
    return;
  }

  const events: string[] = [];
  booking.bookingTickets.forEach(bt => {
    const str = `«${bt.ticket.ticketType.event.name}»`;
    if(events.includes(str)) return;

    events.push(`«${bt.ticket.ticketType.event.name}»`);
  });

  const event = events.join(', ');
  
  let price: number = 0;
  const labeledPrice: { label: string, amount: number }[] = [];
  for(const bkTicket of booking.bookingTickets) {
    price += Number(bkTicket.ticket.ticketType.price);
    labeledPrice.push({
      label: `${bkTicket.ticket.ticketType.name} #${bkTicket.ticket.ticketType.event.id}-${bkTicket.ticket.id}`,
      amount: Number(bkTicket.ticket.ticketType.price) * 100
    });
  }

  const currency = await currencyCache.getCurrency();
  if(price <= Number(currency.min_amount) || price >= Number(currency.max_amount)) {
    if(TELEGRAM_PAYMENTS_LIVE) {
      await ctx.answerCallbackQuery('Оплата невозможна');
      await ctx.reply(
        `⚠️ К сожалению, это бронирование невозможно оплатить в Telegram.\n\n` +
        `Обратитесь в /support для получения инструкций к оплате. Не забудьте указать номер брони: ${booking.id}`,
        { reply_markup: extraGoToHomeKeyboard }
      );
    } else {
      await sendMyBookingPaySimple(ctx, bookingId, page);
    }

    return;
  }

  await ctx.api.sendInvoice(
    ctx.chat!.id,
    `CrowdPass №B${booking.id}`,
    `Ваше бронирование №${booking.id} включает в себя билеты (${booking.bookingTickets.length} шт.) на мероприятие(-я) ${event} общей стоимостью ${formatAmount(price, currency)}`,
    `${booking.id}-${user.id}-booking`,
    'RUB',
    labeledPrice,
    {
      provider_token: TELEGRAM_PAYMENTS_TOKEN,
    },
  );
}

export async function sendMyBookingPayPreCheckout(ctx: ControllerContext) {
  if(!ctx.sfx.user || !ctx.preCheckoutQuery) return await ctx.answerPreCheckoutQuery(false, 'Произошла ошибка');

  const bookingId = Number(ctx.match[1]);
  const userId = Number(ctx.match[2]);

  const booking = await BookingService.getById(bookingId);

  if(userId !== ctx.sfx.user.id || !booking || booking.userId !== ctx.sfx.user.id || booking.status !== "ACTIVE") {
    return await ctx.answerPreCheckoutQuery(false, { error_message: 'Вы не можете оплатить это бронирование. Возможно, бронирование уже оплачено или отменено' });
  }

  await ctx.answerPreCheckoutQuery(true); 
}

export async function sendMyBookingPaySuccess(ctx: SharedContext) {
  const payment = ctx.message?.successful_payment;
  if(!payment) return await ctx.reply(`❌ Произошла ошибка`);;

  const match = payment.invoice_payload.match(/^(\d+)-(\d+)-booking$/);
  if(!match) return await ctx.reply(`❌ Произошла ошибка`);;

  const bookingId = Number(match[1]);
  await BookingService.payBooking(bookingId);

  await ctx.reply(`✅ Бронирование №B${bookingId} оплачено`, {
    reply_markup: new InlineKeyboard()
      .text('🎟️ Мои бронирования', TelegramStrategy.callbackPayloads.myBookingsPage(1)).row()
      .text('🎫 Мои билеты', TelegramStrategy.callbackPayloads.myTicketsPage(1)),
  });
}

export async function sendMyBookingCancel(ctx: ControllerContext, bookingId: number, page: number) {
  const user = ctx.sfx.user!;
  const result = await controller.sendMyBookingCancel(user, bookingId, page);
  TelegramStrategy.doActionReply(ctx, result);
}

export async function sendBookingStart(ctx: ControllerContext, eventId: number, fromPage: number, categoryId: number, subcategoryId: number) {
  const user = ctx.sfx.user!;
  const result = await controller.sendBookingStart(user, eventId, fromPage, categoryId, subcategoryId);
  TelegramStrategy.doActionReply(ctx, result);
}

export async function sendBookingSelectType(ctx: ControllerContext, ticketTypeId: number) {
  const user = ctx.sfx.user!;
  const result = await controller.sendBookingSelectType(user, ticketTypeId);
  TelegramStrategy.doActionReply(ctx, result);
}

export async function sendBookingConfirm(ctx: ControllerContext, userId: number) {
  const user = ctx.sfx.user!;
  const result = await controller.sendBookingConfirm(user, userId);
  TelegramStrategy.doActionReply(ctx, result);
}

export async function sendBookingCancel(ctx: ControllerContext, userId: number) {
  const user = ctx.sfx.user!;
  const result = await controller.sendBookingCancel(user, userId);
  TelegramStrategy.doActionReply(ctx, result);
}