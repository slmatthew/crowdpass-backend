import { CallbackAction } from "../constants/callbackActions";

export const callbackPayloads = {
  eventsPage: (page: number) => `${CallbackAction.EVENTS_PAGE}_${page}`,
  eventDetails: (eventId: number, page: number) => `${CallbackAction.EVENT_DETAILS}_${eventId}_${page}`,
  eventNavigate: (eventId: number, fromPage: number) => `${CallbackAction.EVENT_NAVIGATE}_${eventId}_${fromPage}`,

  bookingStart: (eventId: number, fromPage: number) => `${CallbackAction.BOOKING_START}_${eventId}_${fromPage}`,
  bookingSelectType: (typeId: number) => `${CallbackAction.BOOKING_SELECT_TYPE}_${typeId}`,
  bookingConfirm: (userId: number | string) => `${CallbackAction.BOOKING_CONFIRM}_${userId}`,
  bookingCancel: (userId: number | string) => `${CallbackAction.BOOKING_CANCEL}_${userId}`,

  myBookingsPage: (page: number) => `${CallbackAction.MY_BOOKINGS_PAGE}_${page}`,
  myBookingCancel: (bookingId: number, page: number) => `${CallbackAction.MY_BOOKING_CANCEL}_${bookingId}_${page}`,
  
  ticketQr: (ticketId: number) => `${CallbackAction.TICKET_QR}_${ticketId}`,
};