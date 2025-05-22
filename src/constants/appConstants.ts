export const PAGE_SIZE = 5;

export enum ActionLogAction {
  AUTH_TELEGRAM = "ap.auth.telegram",
  AUTH_VK = "ap.auth.vk",

  EVENT_CREATE = "event.create",
  EVENT_UPDATE = "event.update",

  BOOKING_STATUS_UPDATE = "booking.status.update",

  ROOT_PURPOSE = "system.root-purpose",
}