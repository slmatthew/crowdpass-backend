import { TelegramStrategy } from "./TelegramStrategy";
import { CoreEventsController } from "@/bots/core/controllers/CoreEventsController";
import { ControllerContext } from "./ControllerContext";

const controller = new CoreEventsController(TelegramStrategy);

export async function sendCategoryChoice(ctx: ControllerContext) {
  const result = await controller.sendCategoryChoice();
  TelegramStrategy.doActionReply(ctx, result);
}

// EVENT_CATEGORY
export async function sendSubcategoryChoice(ctx: ControllerContext, categoryId: number) {
  const result = await controller.sendSubcategoryChoice(categoryId);
  TelegramStrategy.doActionReply(ctx, result);
}

// EVENTS_ALL
export async function sendAllEvents(ctx: ControllerContext, page: number = 1) {
  const result = await controller.sendAllEvents(page);
  TelegramStrategy.doActionReply(ctx, result);
}

// EVENT_GET_CATEGORY
export async function sendEventsByCategory(ctx: ControllerContext, categoryId: number, page: number = 1) {
  const result = await controller.sendEventsByCategory(categoryId, page);
  TelegramStrategy.doActionReply(ctx, result);
}

// EVENT_GET_SUBCATEGORY
export async function sendEventsBySubcategory(ctx: ControllerContext, subcategoryId: number, page: number = 1) {
  const result = await controller.sendEventsBySubcategory(subcategoryId, page);
  TelegramStrategy.doActionReply(ctx, result);
}

export async function sendEventDetails(
  ctx: ControllerContext,
  eventId: number,
  fromPage: number,
  entityId: number = 0,
  type: 'all' | 'category' | 'subcategory' = 'all',
  gEventsPage = TelegramStrategy.callbackPayloads.eventsPage,
  gBookingStart = TelegramStrategy.callbackPayloads.bookingStart
) {
  const result = await controller.sendEventDetails(eventId, fromPage, entityId, type, gEventsPage, gBookingStart);
  TelegramStrategy.doActionReply(ctx, result);
}