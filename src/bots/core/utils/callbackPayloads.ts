import { CallbackAction } from "../constants/callbackActions";
import { CallbackPayloadsString } from "../controllers/types/CallbackPayloadsTypes";

export const callbackPayloads: CallbackPayloadsString = {
  eventsPage: (page: number, _: number = 0) => `${CallbackAction.EVENTS_PAGE}_${page}`,
  eventsCategoriedPage: (page: number, entityId: number) => `${CallbackAction.EVENTS_CATEGORIED_PAGE}_${page}_${entityId}`,
  eventsSubcategoriedPage: (page: number, entityId: number) => `${CallbackAction.EVENTS_SUBCATEGORIED_PAGE}_${page}_${entityId}`,
  
  eventDetails: (eventId: number, page: number, _: number = 0) => `${CallbackAction.EVENT_DETAILS}_${eventId}_${page}`,
  eventDetailsCategory: (eventId: number, page: number, entityId: number) => `${CallbackAction.EVENT_DETAILS_CATEGORY}_${eventId}_${page}_${entityId}`,
  eventDetailsSubcategory: (eventId: number, page: number, entityId: number) => `${CallbackAction.EVENT_DETAILS_SUBCATEGORY}_${eventId}_${page}_${entityId}`,

  eventCategory: (categoryId: number) => `${CallbackAction.EVENT_CATEGORY}_${categoryId}`,
  eventGetCategory: (categoryId: number) => `${CallbackAction.EVENT_GET_CATEGORY}_${categoryId}`,
  eventGetSubcategory: (subcategoryId: number) => `${CallbackAction.EVENT_GET_SUBCATEGORY}_${subcategoryId}`,

  bookingStart: (eventId: number, fromPage: number, categoryId: number = 0, subcategoryId: number = 0) => `${CallbackAction.BOOKING_START}_${eventId}_${fromPage}_${categoryId}_${subcategoryId}`,
  bookingSelectType: (typeId: number) => `${CallbackAction.BOOKING_SELECT_TYPE}_${typeId}`,
  bookingConfirm: (userId: number | string) => `${CallbackAction.BOOKING_CONFIRM}_${userId}`,
  bookingCancel: (userId: number | string) => `${CallbackAction.BOOKING_CANCEL}_${userId}`,

  myBookingsPage: (page: number) => `${CallbackAction.MY_BOOKINGS_PAGE}_${page}`,
  myBookingPay: (bookingId: number, page: number) => `${CallbackAction.MY_BOOKING_PAY}_${bookingId}_${page}`,
  myBookingCancel: (bookingId: number, page: number) => `${CallbackAction.MY_BOOKING_CANCEL}_${bookingId}_${page}`,
  
  myTicketsPage: (page: number) => `${CallbackAction.MY_TICKETS_PAGE}_${page}`,
  ticketQr: (ticketId: number) => `${CallbackAction.TICKET_QR}_${ticketId}`,
};