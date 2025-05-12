export interface CallbackPayloadsString {
  eventsPage: (page: number, _?: number) => string,
  eventsCategoriedPage: (page: number, entityId: number) => string,
  eventsSubcategoriedPage: (page: number, entityId: number) => string,
  
  eventDetails: (eventId: number, page: number, _?: number) => string,
  eventDetailsCategory: (eventId: number, page: number, entityId: number) => string,
  eventDetailsSubcategory: (eventId: number, page: number, entityId: number) => string,

  eventCategory: (categoryId: number) => string,
  eventGetCategory: (categoryId: number) => string,
  eventGetSubcategory: (subcategoryId: number) => string,

  bookingStart: (eventId: number, fromPage: number, categoryId: number, subcategoryId: number) => string,
  bookingSelectType: (typeId: number) => string,
  bookingConfirm: (userId: number | string) => string,
  bookingCancel: (userId: number | string) => string,

  myBookingsPage: (page: number) => string,
  myBookingPay: (bookingId: number, page: number) => string,
  myBookingCancel: (bookingId: number, page: number) => string,
  
  myTicketsPage: (page: number) => string,
  ticketQr: (ticketId: number) => string,
}

export type CallbackPayloadsObject = {
  [K in keyof CallbackPayloadsString]: CallbackPayloadsString[K] extends (...args: infer A) => any
    ? (...args: A) => { action: string }
    : never;
};
