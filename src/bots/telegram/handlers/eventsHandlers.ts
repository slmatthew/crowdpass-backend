import { Api, Bot, InlineKeyboard, RawApi } from "grammy";
import { SharedContext } from "@/types/grammy/SessionData";
import { CallbackAction } from "../constants/callbackActions";
import { sendAllEvents, sendCategoryChoice, sendEventDetails, sendEventsByCategory, sendEventsBySubcategory, sendSubcategoryChoice } from "../controllers/eventsController";
import { handlePayload } from "../utils/handlePayload";
import { callbackPayloads } from "../utils/callbackPayloads";

export function handleEventsCallbacks(bot: Bot<SharedContext, Api<RawApi>>) {
  bot.callbackQuery(CallbackAction.EVENTS_ALL, async (ctx) => {
    await sendAllEvents(ctx);
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(CallbackAction.EVENTS_CHOICE_CATEGORY, async (ctx) => {
    await sendCategoryChoice(ctx);
    await ctx.answerCallbackQuery();
  });

  handlePayload<[number]>(bot, CallbackAction.EVENTS_PAGE, async (ctx, page) => {
    await sendAllEvents(ctx, page);
    await ctx.answerCallbackQuery();
  });

  handlePayload<[number, number]>(bot, CallbackAction.EVENTS_CATEGORIED_PAGE, async (ctx, page, categoryId) => {
    await sendEventsByCategory(ctx, categoryId, page);
    await ctx.answerCallbackQuery();
  });

  handlePayload<[number, number]>(bot, CallbackAction.EVENTS_SUBCATEGORIED_PAGE, async (ctx, page, subcategoryId) => {
    await sendEventsBySubcategory(ctx, subcategoryId, page);
    await ctx.answerCallbackQuery();
  });

  handlePayload<[number, number]>(bot, CallbackAction.EVENT_DETAILS, sendEventDetails);

  handlePayload<[number, number, number]>(bot, CallbackAction.EVENT_DETAILS_CATEGORY, async (ctx, eventId, fromPage, categoryId) => {
    await sendEventDetails(ctx, eventId, fromPage, categoryId, 'category', callbackPayloads.eventsCategoriedPage);
  });

  handlePayload<[number, number, number]>(bot, CallbackAction.EVENT_DETAILS_SUBCATEGORY, async (ctx, eventId, fromPage, subcategoryId) => {
    await sendEventDetails(ctx, eventId, fromPage, subcategoryId, 'subcategory', callbackPayloads.eventsSubcategoriedPage);
  });

  handlePayload<[number]>(bot, CallbackAction.EVENT_CATEGORY, async (ctx, categoryId) => {
    await sendSubcategoryChoice(ctx, categoryId);
    await ctx.answerCallbackQuery();
  });

  handlePayload<[number]>(bot, CallbackAction.EVENT_GET_CATEGORY, async (ctx, categoryId) => {
    await sendEventsByCategory(ctx, categoryId);
    await ctx.answerCallbackQuery();
  });

  handlePayload<[number]>(bot, CallbackAction.EVENT_GET_SUBCATEGORY, async (ctx, subcategoryId) => {
    await sendEventsBySubcategory(ctx, subcategoryId);
    await ctx.answerCallbackQuery();
  });
}