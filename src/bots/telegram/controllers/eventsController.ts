import { CategoryService } from "@/services/categoryService";
import { Category, Subcategory } from "@prisma/client";
import { InlineKeyboard } from "grammy";
import { callbackPayloads } from "../utils/callbackPayloads";
import { chunkArray } from "../utils/chunkArray";
import { CallbackAction } from "../constants/callbackActions";
import { EventService } from "@/services/eventService";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { PAGE_SIZE } from "@/constants/appConstants";
import dayjs from "dayjs";
import { Event } from "@prisma/client";
import { ControllerContext } from "./ControllerContext";

export async function sendCategoryChoice(ctx: ControllerContext) {
  const categories = await CategoryService.getAllCategories();
  const rows = chunkArray<Category>(categories, 2);

  let keyboard = new InlineKeyboard();
  for(const row of rows) {
    const buttons = row.map((c) => 
      InlineKeyboard.text(c.name, callbackPayloads.eventCategory(c.id))
    );
    keyboard = keyboard.row(...buttons);
  }

  keyboard.row(InlineKeyboard.text("Пропустить ➡️", CallbackAction.EVENTS_ALL));
  keyboard.row(InlineKeyboard.text("Главное меню", CallbackAction.GO_HOME));

  const text = '🎟️ Выберите категорию мероприятий или пропустите этот шаг';

  try {
    await ctx.editMessageText(text, { reply_markup: keyboard });
  } catch(err) {
    await ctx.reply(text, { reply_markup: keyboard });
  }
}

// EVENT_CATEGORY
export async function sendSubcategoryChoice(ctx: ControllerContext, categoryId: number) {
  const subcategories = await CategoryService.getSubcategoriesByCategoryId(categoryId);
  const rows = chunkArray<Subcategory>(subcategories, 2);

  let keyboard = new InlineKeyboard();
  for(const row of rows) {
    const buttons = row.map((s) => 
      InlineKeyboard.text(s.name, callbackPayloads.eventGetSubcategory(s.id))
    );
    keyboard = keyboard.row(...buttons);
  }

  keyboard.row(InlineKeyboard.text("Пропустить ➡️", callbackPayloads.eventGetCategory(categoryId)));
  keyboard.row(InlineKeyboard.text("Главное меню", CallbackAction.GO_HOME));

  const text = '🎟️ Выберите подкатегорию мероприятий или пропустите этот шаг';

  try {
    await ctx.editMessageText(text, { reply_markup: keyboard });
  } catch(err) {
    await ctx.reply(text, { reply_markup: keyboard });
  }
}

async function sendEvents(
  ctx: ControllerContext,
  events: Event[],
  page: number,
  entityId: number = 0,
  gEventDetails: (eventId: number, page: number, entityId: number) => string = callbackPayloads.eventDetails,
  gEventsPage: (page: number, entityId: number) => string = callbackPayloads.eventsPage,
) {
  if (events.length === 0) {
    const message = "Пока нет доступных мероприятий 😔";
    try {
      await ctx.editMessageText(message, extraGoToHomeKeyboard);
    } catch(err) {
      await ctx.reply(message, extraGoToHomeKeyboard);
    }
    return;
  }

  const totalPages = Math.ceil(events.length / PAGE_SIZE);

  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const eventsPage = events.slice(startIndex, endIndex);

  let text = `🎟️ *Мероприятия (стр. ${page}/${totalPages}):*\n\n`;

  const keyboard = new InlineKeyboard();

  eventsPage.forEach((event, index) => {
    const eventNumber = startIndex + index + 1;
    text += `${eventNumber}. ${event.name} (${dayjs(event.startDate).format("DD.MM.YYYY")})\n`;
    keyboard.text(`${eventNumber}`, gEventDetails(event.id, page, entityId));
  });    

  keyboard.row();

  if (page > 1) {
    keyboard.text("⬅️ Назад", gEventsPage(page - 1, entityId));
  }
  if (page < totalPages) {
    keyboard.text("Вперёд ➡️", gEventsPage(page + 1, entityId));
  }

  keyboard.row();
  keyboard.text('Главное меню', CallbackAction.GO_HOME);

  try {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  } catch(err) {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }
}

// EVENTS_ALL
export async function sendAllEvents(ctx: ControllerContext, page: number = 1) {
  const events = await EventService.getAllEvents();
  sendEvents(ctx, events, page);
}

// EVENT_GET_CATEGORY
export async function sendEventsByCategory(ctx: ControllerContext, categoryId: number, page: number = 1) {
  const events = await EventService.getEventsByCategoryId(categoryId);
  sendEvents(ctx, events, page, categoryId, callbackPayloads.eventDetailsCategory, callbackPayloads.eventsCategoriedPage);
}

// EVENT_GET_SUBCATEGORY
export async function sendEventsBySubcategory(ctx: ControllerContext, subcategoryId: number, page: number = 1) {
  const events = await EventService.getEventsBySubcategoryId(subcategoryId);
  sendEvents(ctx, events, page, subcategoryId, callbackPayloads.eventDetailsSubcategory, callbackPayloads.eventsSubcategoriedPage);
}

export async function sendEventDetails(
  ctx: ControllerContext,
  eventId: number,
  fromPage: number,
  entityId: number = 0,
  type: 'all' | 'category' | 'subcategory' = 'all',
  gEventsPage: (page: number, entityId: number) => string = callbackPayloads.eventsPage,
  gBookingStart: (eventId: number, fromPage: number, categoryId: number, subcategoryId: number) => string = callbackPayloads.bookingStart
) {
  const event = await EventService.getEventById(eventId);
    
  if(!event) {
    await ctx.answerCallbackQuery({ text: "Мероприятие не найдено!" });
    return;
  }

  const categoryId = type === 'category' ? entityId : 0;
  const subcategoryId = type === 'subcategory' ? entityId : 0;

  const keyboard = new InlineKeyboard()
    .text("🎟️ Забронировать билет", gBookingStart(eventId, fromPage, categoryId, subcategoryId))
    .row()
    .text("⬅️ Назад", gEventsPage(fromPage, entityId));

  await ctx.editMessageText(
    `🎫 *${event.name}*\n\n${event.description}\n\n📅 Дата: ${dayjs(event.startDate).format("DD.MM.YYYY HH:mm")}\n📍 Место: ${event.location}`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );

  await ctx.answerCallbackQuery();
}