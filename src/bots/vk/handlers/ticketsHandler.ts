import { CallbackAction } from "@/bots/core/constants/callbackActions";
import { handlePayload } from "../utils/handlePayload";
import { sendMyTickets, sendTicketQr } from "../controllers/ticketController";
import { VkRouter } from "../routers/router";

export function handleTickets(router: VkRouter) {
  router.registerPayloadCommand(CallbackAction.MY_TICKETS, async (ctx) => {
    await sendMyTickets(ctx);
  });
  handlePayload<[number]>(router, CallbackAction.MY_TICKETS_PAGE, sendMyTickets);
  handlePayload<[number]>(router, CallbackAction.TICKET_QR, sendTicketQr);
}