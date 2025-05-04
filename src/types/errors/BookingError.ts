export const BookingErrorCodes = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  TICKET_TYPE_NOT_FOUND: "TICKET_TYPE_NOT_FOUND",
  BOOKING_TICKETS_NOT_FOUND: "BOOKING_TICKETS_NOT_FOUND",

  TOO_MUCH_TICKETS: "TOO_MUCH_TICKETS",

  EVENT_ALREADY_ENDED: "EVENT_ALREADY_ENDED",

  INVALID_QUANTITY: "INVALID_QUANTITY",
  INVALID_BOOKING_ID: "INVALID_BOOKING_ID",
  INVALID_BOOKING_STATUS: "INVALID_BOOKING_STATUS",
} as const;

export class BookingError extends Error {
  code: string;
  metadata?: any;

  constructor(code: string, message: string, metadata?: any) {
    super(message);
    this.name = "BookingError";
    this.code = code;
    this.metadata = metadata;
  }
}