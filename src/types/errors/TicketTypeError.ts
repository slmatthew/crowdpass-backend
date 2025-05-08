export const TicketTypeErrorCodes = {
  TICKET_TYPE_NOT_FOUND: 'TICKET_TYPE_NOT_FOUND',

  TOO_MANY_TICKETS: 'TOO_MANY_TICKETS',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  EVENT_ALREADY_ENDED: 'EVENT_ALREADY_ENDED',

  ACCESS_DENIED: 'ACCESS_DENIED',
  NEED_CONFIRM: 'NEED_CONFIRM',
} as const;

export class TicketTypeError extends Error {
  code: string;
  metadata?: any;

  constructor(code: string, message: string, metadata?: any) {
    super(message);
    this.name = "TicketTypeError";
    this.code = code;
    this.metadata = metadata;
  }
}