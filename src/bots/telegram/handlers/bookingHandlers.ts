import { Api, Bot, RawApi } from "grammy";
import { SharedContext } from "@/types/grammy/SessionData";
import { CallbackAction } from "../constants/callbackActions";
import { handlePayload } from "../utils/handlePayload";
import { sendBookingCancel, sendBookingConfirm, sendBookingSelectType, sendBookingStart, sendMyBookingCancel, sendMyBookingPay, sendMyBookingPayPreCheckout, sendMyBookingPaySuccess, sendMyBookings } from "../controllers/bookingsController";

export function handleBookingCallbacks(bot: Bot<SharedContext, Api<RawApi>>) {
  bot.callbackQuery(CallbackAction.MY_BOOKINGS, async (ctx) => {
    await sendMyBookings(ctx);
  });
  handlePayload<[number]>(bot, CallbackAction.MY_BOOKINGS_PAGE, sendMyBookings);
  handlePayload<[number, number]>(bot, CallbackAction.MY_BOOKING_PAY, sendMyBookingPay);
  handlePayload<[number, number]>(bot, CallbackAction.MY_BOOKING_CANCEL, sendMyBookingCancel);

  handlePayload<[number, number, number, number]>(bot, CallbackAction.BOOKING_START, sendBookingStart);
  handlePayload<[number]>(bot, CallbackAction.BOOKING_SELECT_TYPE, sendBookingSelectType);
  handlePayload<[number]>(bot, CallbackAction.BOOKING_CONFIRM, sendBookingConfirm);
  handlePayload<[number]>(bot, CallbackAction.BOOKING_CANCEL, sendBookingCancel);

  bot.preCheckoutQuery(/^(\d+)-(\d+)-booking$/, sendMyBookingPayPreCheckout);
  bot.on('message:successful_payment', sendMyBookingPaySuccess);
}