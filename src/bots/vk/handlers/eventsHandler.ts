import { CallbackAction } from "@/bots/core/constants/callbackActions"
import { VkRouter } from "../routers/router"
import { sendAllEvents, sendCategoryChoice, sendEventDetails, sendEventsByCategory, sendEventsBySubcategory, sendSubcategoryChoice } from "../controllers/eventsController"
import { handlePayload } from "../utils/handlePayload";
import { VkStrategy } from "../controllers/VkStrategy";

export function handleEvents(router: VkRouter) {
  router.registerTextPattern(/^\/?(events|мероприятия)(\s+(\d+))?$/i, async (ctx, match) => {
    const page = match[3] ? Number(match[3]) : 1;
    await sendAllEvents(ctx, page);
  });

  router.registerPayloadCommand(CallbackAction.EVENTS_ALL, sendAllEvents);
  router.registerPayloadCommand(CallbackAction.EVENTS_CHOICE_CATEGORY, sendCategoryChoice);

  handlePayload<[number]>(router, CallbackAction.EVENTS_PAGE, sendAllEvents);
  handlePayload<[number, number]>(router, CallbackAction.EVENTS_CATEGORIED_PAGE, sendEventsByCategory);
  handlePayload<[number, number]>(router, CallbackAction.EVENTS_SUBCATEGORIED_PAGE, sendEventsBySubcategory);

  handlePayload<[number, number]>(router, CallbackAction.EVENT_DETAILS, sendEventDetails);
  handlePayload<[number, number, number]>(router, CallbackAction.EVENT_DETAILS_CATEGORY, async (ctx, eventId, fromPage, categoryId) => {
    await sendEventDetails(ctx, eventId, fromPage, categoryId, 'category', VkStrategy.callbackPayloads.eventsCategoriedPage);
  });
  handlePayload<[number, number, number]>(router, CallbackAction.EVENT_DETAILS_SUBCATEGORY, async (ctx, eventId, fromPage, categoryId) => {
    await sendEventDetails(ctx, eventId, fromPage, categoryId, 'subcategory', VkStrategy.callbackPayloads.eventsSubcategoriedPage);
  });

  handlePayload<[number]>(router, CallbackAction.EVENT_CATEGORY, sendSubcategoryChoice);
  handlePayload<[number]>(router, CallbackAction.EVENT_GET_CATEGORY, sendEventsByCategory);
  handlePayload<[number]>(router, CallbackAction.EVENT_GET_SUBCATEGORY, sendEventsBySubcategory);
}