import { KeyboardBuilder, MessageContext } from "vk-io";
import { VkStrategy } from "./VkStrategy";
import { CoreTicketsController } from "@/bots/core/controllers/CoreTicketsController";
import { ActionReplyPhoto } from "@/bots/core/controllers/types/ControllerResponse";
import { convertKeyboard } from "../utils/convertKeyboard";

const controller = new CoreTicketsController(VkStrategy);

export async function sendMyTickets(ctx: MessageContext, page: number = 1) {
  const user = ctx.state.user;
  const result = await controller.sendMyTickets(user, page);
  VkStrategy.doActionReply(ctx, result);
}

export async function sendTicketQr(ctx: MessageContext, ticketId: number) {
  const user = ctx.state.user;
  const result = await controller.sendTicketQr(user, ticketId);
  const action = result.action;

  if((action as ActionReplyPhoto).photo) {
    await ctx.setActivity();

    await ctx.sendPhotos([{
      value: (action as ActionReplyPhoto).photo,
      filename: `ticket_${ticketId}.png`,
    }], {
      message: action.text?.plain,
      keyboard: action.keyboard ? convertKeyboard(action.keyboard) as KeyboardBuilder : undefined,
    });
  } else VkStrategy.doActionReply(ctx, result);
}