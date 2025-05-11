import { MessageContext } from "vk-io";
import { bookingSessions } from "../sessions/bookingSessions";
import { TicketService } from "@/services/ticketService";
import { KeyboardBuilder } from "vk-io";

export class StepRouter {
  async handle(ctx: MessageContext) {
    const userId = ctx.state.user?.id.toString();
    if (!userId) return false;

    const session = bookingSessions[userId];
    if (session?.step === "awaiting_tickets_count") {
      const count = parseInt(ctx.text?.trim() || "");

      if (isNaN(count) || count <= 0) {
        await ctx.send("❗ Введите корректное положительное число или напишите \"отмена\".");
        return true;
      }

      const available = await TicketService.getAvailableTickets(session.ticketTypeId!, count);

      if (available.length < count) {
        await ctx.send(`😔 Недостаточно билетов. Доступно только ${available.length}`);
        return true;
      }

      session.ticketsCount = count;
      session.step = null;

      const keyboard = new KeyboardBuilder()
        .textButton({ label: "✅ Подтвердить", payload: { action: `confirm_booking_${userId}` } })
        .textButton({ label: "❌ Отменить", payload: { action: `cancel_booking_${userId}` } })
        .inline();

      await ctx.send(`Вы хотите забронировать ${count} билет(ов). Подтвердите действие:`, { keyboard });
      return true;
    }

    return false;
  }
}
