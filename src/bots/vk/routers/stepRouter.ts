import { MessageContext } from "vk-io";
import { TicketService } from "@/services/ticketService";
import { KeyboardBuilder } from "vk-io";
import { bookingSessionService } from "@/bots/core/services/BookingSessionService";
import { VkStrategy } from "../controllers/VkStrategy";

export class StepRouter {
  async handle(ctx: MessageContext) {
    const userId = ctx.state.user.id;
    if (!userId) return false;

    const session = bookingSessionService.getSession(userId);
    if (session && session.step === 'ask_count') {
      const count = parseInt(ctx.text?.trim() || "");

      if (isNaN(count) || count <= 0) {
        await ctx.send("❗ Введите корректное положительное число или напишите \"отмена\".");
        return true;
      }

      const available = await TicketService.getAvailableTickets(session.ticketTypeId!, count);

      if (available.length < count) {
        await ctx.send(`😔 Недостаточно свободных билетов. Доступно только ${available.length}`);
        return true;
      }

      bookingSessionService.setSession(userId, { ...session, step: 'end', ticketsCount: count });

      const keyboard = new KeyboardBuilder()
        .textButton({ label: "✅ Подтвердить", payload: VkStrategy.callbackPayloads.bookingConfirm(userId) })
        .textButton({ label: "❌ Отменить", payload: { action: VkStrategy.callbackPayloads.bookingCancel(userId) } })
        .inline();

      await ctx.send(`Вы хотите забронировать ${count} билет(ов). Подтвердите действие:`, { keyboard });
      return true;
    }

    return false;
  }
}
