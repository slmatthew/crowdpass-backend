import { MessageContext, KeyboardBuilder } from "vk-io";
import { EventService } from "@/services/eventService";
import { PAGE_SIZE } from "@/constants/appConstants";

export async function handleEvents(ctx: MessageContext, page: number = 1) {
  return await sendEventsPage(ctx, page);
}

export async function sendEventsPage(ctx: MessageContext, page: number) {
  const events = await EventService.getAllEvents();

  if (!events.length) {
    return ctx.send("Пока нет доступных мероприятий 😔");
  }

  const totalPages = Math.ceil(events.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageEvents = events.slice(startIndex, startIndex + PAGE_SIZE);

  let text = `🎟️ Мероприятия (стр. ${page}/${totalPages}):\n\n`;

  const keyboard = new KeyboardBuilder();

  pageEvents.forEach((event, index) => {
    const eventNumber = startIndex + index + 1;
    text += `${eventNumber}. ${event.name} (${new Date(event.startDate).toLocaleDateString()})\n`;
    keyboard.textButton({
      label: `${eventNumber}`,
      payload: { action: `event_${event.id}_${page}` },
    });
  });

  keyboard.row();

  if (page > 1) {
    keyboard.textButton({
      label: "⬅️ Назад",
      payload: { action: `page_${page - 1}` },
    });
  }

  if (page < totalPages) {
    keyboard.textButton({
      label: "Вперёд ➡️",
      payload: { action: `page_${page + 1}` },
    });
  }

  keyboard.row().textButton({
    label: "🏠 Главное меню",
    payload: { action: "go_to_home" },
  });

  keyboard.inline();

  await ctx.send(text, { keyboard });
}
