import { Api, Bot, RawApi } from "grammy";
import { SharedContext } from "@/types/grammy/SessionData";
import { CallbackAction } from "../constants/callbackActions";
import { handlePayload } from "../utils/handlePayload";
import { sendMyTickets, sendTicketQr } from "../controllers/ticketsController";

export function handleTicketCallbacks(bot: Bot<SharedContext, Api<RawApi>>) {
  bot.callbackQuery(CallbackAction.MY_TICKETS, async (ctx) => {
    await sendMyTickets(ctx);
  });
  handlePayload<[number]>(bot, CallbackAction.MY_TICKETS_PAGE, sendMyTickets);
  handlePayload<[number]>(bot, CallbackAction.TICKET_QR, sendTicketQr);
}