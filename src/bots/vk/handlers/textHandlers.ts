import { MessageContext } from "vk-io";
import { showStartMenu } from "../commands/start";

export async function messageHandler(ctx: MessageContext) {
  const text = ctx.text?.toLowerCase();

  if (text === "начать" || text === "/start") {
    return showStartMenu(ctx);
  }

  // fallback
  return ctx.send("Неизвестная команда. Напиши «Начать».");
}
