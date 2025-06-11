export const EventErrorCodes = {
  EVENT_NOT_FOUND: "EVENT_NOT_FOUND",

  MANAGER_NOT_ALLOWED: "MANAGER_NOT_ALLOWED",
} as const;

export class EventError extends Error {
  code: string;
  metadata?: any;

  constructor(code: string, message: string, metadata?: any) {
    super(message);
    this.name = "EventError";
    this.code = code;
    this.metadata = metadata;
  }
}