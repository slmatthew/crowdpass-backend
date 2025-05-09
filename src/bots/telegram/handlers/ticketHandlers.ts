import { Api, Bot, RawApi } from "grammy";
import { SharedContext } from "@/types/grammy/SessionData";
import { CallbackAction } from "../constants/callbackActions";
import { handlePayload } from "../utils/handlePayload";
import { sendMyTickets, sendTicketQr } from "../controllers/ticketsController";

export function handleTicketCallbacks(bot: Bot<SharedContext, Api<RawApi>>) {
  bot.callbackQuery(CallbackAction.MY_TICKETS, sendMyTickets);
  handlePayload<[number]>(bot, CallbackAction.TICKET_QR, sendTicketQr);
}