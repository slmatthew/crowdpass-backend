import { MessageContext } from "vk-io";
import { mainMenuKeyboard } from "../markups/mainMenu";

export async function sendHome(ctx: MessageContext) {
  const user = ctx.state.user;
  await ctx.send({
    message: `👋 ${user.firstName}, добро пожаловать в CrowdPass!\n\nЭто главное меню. Выберите действие ниже 👇`,
    keyboard: mainMenuKeyboard,
  });
}