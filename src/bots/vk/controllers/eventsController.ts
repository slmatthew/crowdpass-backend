import { VkStrategy } from "./VkStrategy";
import { CoreEventsController } from "@/bots/core/controllers/CoreEventsController";
import { MessageContext } from "vk-io";

const controller = new CoreEventsController(VkStrategy);

export async function sendCategoryChoice(ctx: MessageContext) {
  const result = await controller.sendCategoryChoice();
  VkStrategy.doActionReply(ctx, result);
}

// EVENT_CATEGORY
export async function sendSubcategoryChoice(ctx: MessageContext, categoryId: number) {
  const result = await controller.sendSubcategoryChoice(categoryId);
  VkStrategy.doActionReply(ctx, result);
}

// EVENTS_ALL
export async function sendAllEvents(ctx: MessageContext, page: number = 1) {
  const result = await controller.sendAllEvents(page);
  VkStrategy.doActionReply(ctx, result);
}

// EVENT_GET_CATEGORY
export async function sendEventsByCategory(ctx: MessageContext, categoryId: number, page: number = 1) {
  const result = await controller.sendEventsByCategory(categoryId, page);
  VkStrategy.doActionReply(ctx, result);
}

// EVENT_GET_SUBCATEGORY
export async function sendEventsBySubcategory(ctx: MessageContext, subcategoryId: number, page: number = 1) {
  const result = await controller.sendEventsBySubcategory(subcategoryId, page);
  VkStrategy.doActionReply(ctx, result);
}

export async function sendEventDetails(
  ctx: MessageContext,
  eventId: number,
  fromPage: number,
  entityId: number = 0,
  type: 'all' | 'category' | 'subcategory' = 'all',
  gEventsPage = VkStrategy.callbackPayloads.eventsPage,
  gBookingStart = VkStrategy.callbackPayloads.bookingStart
) {
  const result = await controller.sendEventDetails(eventId, fromPage, entityId, type, gEventsPage, gBookingStart);
  VkStrategy.doActionReply(ctx, result);
}