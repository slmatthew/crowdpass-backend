import { sendBookingCancel, sendBookingConfirm, sendBookingSelectType, sendBookingStart, sendMyBookingCancel, sendMyBookingPay, sendMyBookings } from "../controllers/bookingsController";
import { VkRouter } from "../routers/router";
import { CallbackAction } from "@/bots/core/constants/callbackActions";
import { handlePayload } from "../utils/handlePayload";

export function handleBookings(router: VkRouter) {
  router.registerTextCommand('брони', sendMyBookings);

  router.registerPayloadCommand(CallbackAction.MY_BOOKINGS, sendMyBookings);
  handlePayload<[number]>(router, CallbackAction.MY_BOOKINGS_PAGE, sendMyBookings);
  handlePayload<[number, number]>(router, CallbackAction.MY_BOOKING_PAY, sendMyBookingPay);
  handlePayload<[number, number]>(router, CallbackAction.MY_BOOKING_CANCEL, sendMyBookingCancel);

  handlePayload<[number, number, number, number]>(router, CallbackAction.BOOKING_START, sendBookingStart);
  handlePayload<[number]>(router, CallbackAction.BOOKING_SELECT_TYPE, sendBookingSelectType);
  handlePayload<[number]>(router, CallbackAction.BOOKING_CONFIRM, sendBookingConfirm);
  handlePayload<[number]>(router, CallbackAction.BOOKING_CANCEL, sendBookingCancel);
}