import { Event, Category, Subcategory } from "@prisma/client";
import dayjs from "dayjs";
import { EventService } from "@/services/eventService";
import { CategoryService } from "@/services/categoryService";
import { PAGE_SIZE } from "@/constants/appConstants";
import { CallbackAction } from "../constants/callbackActions";
import { chunkArray } from "../utils/chunkArray";
import { KeyboardBuilder } from "../ui/KeyboardBuilder";
import { ActionReply, ControllerResponse } from "./types/ControllerResponse";
import { CoreController } from "./CoreController";

export class CoreEventsController extends CoreController {
  private sendChoice<T extends Category | Subcategory>(
    entities: T[],
    entityLabel: 'категорию' | 'подкатегорию',
    nextPage: (...args: any[]) => string | { action: string },
    skipPage: string | { action: string },
  ): ControllerResponse {
    const rows = chunkArray<T>(entities, 2);

    const keyboard = new KeyboardBuilder().inline();
    for(const row of rows) {
      for(const ent of row) {
        keyboard.callbackButton(ent.name, nextPage(ent.id))
      }
      keyboard.row();
    }

    keyboard.callbackButton("Пропустить ➡️", skipPage);
    keyboard.row();
    keyboard.callbackButton("Главное меню", this.strategy.callbackAction(CallbackAction.GO_HOME));

    const text = `🎟️ Выберите ${entityLabel} мероприятий или пропустите этот шаг`;

    const textContent = { plain: text };
    const action = { text: textContent, keyboard: keyboard.build() } as ActionReply;

    return { ok: true, action: action };
  } 

  async sendCategoryChoice(): Promise<ControllerResponse> {
    const categories = await CategoryService.getAllCategories();
    return this.sendChoice<Category>(
      categories,
      'категорию',
      this.strategy.callbackPayloads.eventCategory,
      this.strategy.callbackAction(CallbackAction.EVENTS_ALL)
    );
  }

  // EVENT_CATEGORY
  async sendSubcategoryChoice(categoryId: number): Promise<ControllerResponse> {
    const subcategories = await CategoryService.getSubcategoriesByCategoryId(categoryId);
    return this.sendChoice<Subcategory>(
      subcategories,
      'подкатегорию',
      this.strategy.callbackPayloads.eventGetSubcategory,
      this.strategy.callbackPayloads.eventGetCategory(categoryId)
    );
  }

  /**
   * 
   * @TODO fix types for gEventDetails & gEventsPage
   * @param events 
   * @param page 
   * @param entityId 
   * @param gEventDetails (eventId: number, page: number, entityId: number) => string | { action: string }
   * @param gEventsPage (page: number, entityId: number) => string | { action: string }
   * @returns 
   */
  private async sendEvents(
    events: Event[],
    page: number,
    entityId: number = 0,
    gEventDetails = this.strategy.callbackPayloads.eventDetails,
    gEventsPage = this.strategy.callbackPayloads.eventsPage,
  ): Promise<ControllerResponse> {
    if (events.length === 0) {
      return this.badResult("Пока нет доступных мероприятий 😔");
    }

    const totalPages = Math.ceil(events.length / PAGE_SIZE);

    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const eventsPage = events.slice(startIndex, endIndex);

    const mdHeader = `🎟️ *Мероприятия (стр. ${page}/${totalPages}):*\n\n`;
    const plHeader = `🎟️ Мероприятия (стр. ${page}/${totalPages}):\n\n`;
    let text = '';

    const keyboard = new KeyboardBuilder().inline();

    eventsPage.forEach((event, index) => {
      const eventNumber = startIndex + index + 1;
      text += `${eventNumber}. ${event.name} (${dayjs(event.startDate).format("DD.MM.YYYY")})\n`;
      keyboard.callbackButton(`${eventNumber}`, gEventDetails(event.id, page, entityId));
    });    

    keyboard.row();

    if (page > 1) {
      keyboard.callbackButton("⬅️ Назад", gEventsPage(page - 1, entityId));
    }
    if (page < totalPages) {
      keyboard.callbackButton("Вперёд ➡️", gEventsPage(page + 1, entityId));
    }

    keyboard.row();
    keyboard.callbackButton('Главное меню', this.strategy.callbackAction(CallbackAction.GO_HOME));

    return {
      ok: true,
      action: {
        text: {
          plain: plHeader + text,
          markdown: mdHeader + text,
        },
        keyboard: keyboard.build(),
      }
    };
  }

  // EVENTS_ALL
  async sendAllEvents(page: number = 1): Promise<ControllerResponse> {
    const events = await EventService.getAllEvents();
    return this.sendEvents(events, page);
  }

  // EVENT_GET_CATEGORY
  async sendEventsByCategory(categoryId: number, page: number = 1): Promise<ControllerResponse> {
    const events = await EventService.getEventsByCategoryId(categoryId);
    return this.sendEvents(events, page, categoryId, this.strategy.callbackPayloads.eventDetailsCategory, this.strategy.callbackPayloads.eventsCategoriedPage);
  }

  // EVENT_GET_SUBCATEGORY
  async sendEventsBySubcategory(subcategoryId: number, page: number = 1): Promise<ControllerResponse> {
    const events = await EventService.getEventsBySubcategoryId(subcategoryId);
    return this.sendEvents(events, page, subcategoryId, this.strategy.callbackPayloads.eventDetailsSubcategory, this.strategy.callbackPayloads.eventsSubcategoriedPage);
  }

  /**
   * @TODO fix types for gEventsPage & gBookingStart
   */
  async sendEventDetails(
    eventId: number,
    fromPage: number,
    entityId: number = 0,
    type: 'all' | 'category' | 'subcategory' = 'all',
    gEventsPage = this.strategy.callbackPayloads.eventsPage,
    gBookingStart = this.strategy.callbackPayloads.bookingStart
  ): Promise<ControllerResponse> {
    const event = await EventService.getEventById(eventId);
      
    if(!event) {
      return this.badResult("Мероприятие не найдено!");
    }

    const categoryId = type === 'category' ? entityId : 0;
    const subcategoryId = type === 'subcategory' ? entityId : 0;

    const keyboard = new KeyboardBuilder()
      .inline()
      .callbackButton("🎟️ Забронировать билет", gBookingStart(eventId, fromPage, categoryId, subcategoryId))
      .row()
      .callbackButton("⬅️ Назад", gEventsPage(fromPage, entityId));

    const mainContent = `\n\n${event.description}\n\n📅 Дата: ${dayjs(event.startDate).format("DD.MM.YYYY HH:mm")}\n📍 Место: ${event.location}`;

    const text = {
      plain: `🎫 ${event.name}${mainContent}`,
      markdown: `🎫 *${event.name}*${mainContent}`,
    };

    return {
      ok: true,
      action: {
        text,
        keyboard: keyboard.build(),
      }
    };
  }
}