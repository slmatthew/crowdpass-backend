import { CoreTicketsController } from "@/bots/core/controllers/CoreTicketsController";
import { TelegramStrategy } from "./TelegramStrategy";
import { ControllerContext } from "./ControllerContext";
import { ActionReplyPhoto } from "@/bots/core/controllers/types/ControllerResponse";
import { InlineKeyboard, InputFile } from "grammy";
import { convertKeyboard } from "../utils/convertKeyboard";

const controller = new CoreTicketsController(TelegramStrategy);

export async function sendMyTickets(ctx: ControllerContext, page: number = 1) {
  const user = ctx.sfx.user!;
  const result = await controller.sendMyTickets(user, page);
  TelegramStrategy.doActionReply(ctx, result);
}

export async function sendTicketQr(ctx: ControllerContext, ticketId: number) {
  const user = ctx.sfx.user!;
  const result = await controller.sendTicketQr(user, ticketId);
  const action = result.action;

  if((action as ActionReplyPhoto).photo) {
    await ctx.editMessageText('Отправляю QR-код 👇🏻');

    if(ctx.chat) await ctx.api.sendChatAction(ctx.chat.id, 'upload_photo');

    await ctx.replyWithPhoto(new InputFile((action as ActionReplyPhoto).photo), {
      caption: action.text?.plain,
      reply_markup: action.keyboard ? convertKeyboard(action.keyboard) as InlineKeyboard : undefined,
    });

    await ctx.answerCallbackQuery();
  } else TelegramStrategy.doActionReply(ctx, result);
}