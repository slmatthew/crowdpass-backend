import { Api, Bot, Context, InlineKeyboard, RawApi } from "grammy";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { bookingSessions } from "../sessions/bookingSession";
import { sendBookingsPage } from "../utils/paginator";
import { bookingTimeouts } from "../sessions/bookingTimeouts";
import { BookingService } from "@/services/bookingService";
import { BookingError } from "@/types/errors/BookingError";
import { TicketService } from "@/services/ticketService";
import { SharedContext } from "@/types/grammy/SessionData";
import { CallbackAction } from "../constants/callbackActions";
import { callbackPayloads } from "../utils/callbackPayloads";
import { handlePayload } from "../utils/handlePayload";
import { sendBookingCancel, sendBookingConfirm, sendBookingSelectType, sendBookingStart, sendMyBookingCancel, sendMyBookings } from "../controllers/bookingsController";

export function handleBookingCallbacks(bot: Bot<SharedContext, Api<RawApi>>) {
  handlePayload<[number, number, number, number]>(bot, CallbackAction.BOOKING_START, sendBookingStart);

  bot.callbackQuery(CallbackAction.MY_BOOKINGS, async (ctx) => {
    await sendMyBookings(ctx);
  });
  handlePayload<[number]>(bot, CallbackAction.MY_BOOKINGS_PAGE, sendMyBookings);

  handlePayload<[number, number]>(bot, CallbackAction.MY_BOOKING_CANCEL, sendMyBookingCancel);

  handlePayload<[number]>(bot, CallbackAction.BOOKING_SELECT_TYPE, sendBookingSelectType);

  handlePayload<[number]>(bot, CallbackAction.BOOKING_CONFIRM, sendBookingConfirm);

  handlePayload<[number]>(bot, CallbackAction.BOOKING_CANCEL, sendBookingCancel);
}