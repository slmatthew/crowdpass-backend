import { UserService } from "@/services/userService";
import { Bot, session } from "grammy";

import { handleCommands } from "./handlers/commandHandler";
import { handleBookingCallbacks } from "./handlers/bookingHandlers";
import { handleTicketCallbacks } from "./handlers/ticketHandlers";
import { handleNavigationCallbacks } from "./handlers/navigationHandlers";
import { handleEventsCallbacks } from "./handlers/eventsHandlers";
import { handleText } from "./handlers/textHandlers";

import { SharedContext, SessionData } from "@/types/grammy/SessionData";
import { isRootSetupActive } from "@/utils/checkRoot";

import { claimCommand } from "./commands";

const token: string = process.env.NODE_ENV === 'development' ? `${process.env.TELEGRAM_BOT_TOKEN}/test` : process.env.TELEGRAM_BOT_TOKEN!;

const bot = new Bot<SharedContext>(token);

function initialSession(): SessionData {
  return { step: null };
}

/* middleware */
bot.use(session({ initial: initialSession }));
bot.use(async (ctx, next) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  const user = await UserService.findOrCreateUser({
    telegramId: telegramUser.id.toString(),
    firstName: telegramUser.first_name,
    lastName: telegramUser.last_name ?? "",
  });

  ctx.sfx = { user };

  await next();
});

/* commands */
handleCommands(bot);

/* callbacks */
handleNavigationCallbacks(bot);
handleEventsCallbacks(bot);
handleBookingCallbacks(bot);
handleTicketCallbacks(bot);

bot.catch((err) => {
  console.error("Ошибка в боте:", err.error);
});

export function startTelegramBot() {
  if(isRootSetupActive()) bot.command('claim', claimCommand);
  handleText(bot);

  bot.use(console.log)

  console.log("🚀 Telegram bot running");
  bot.start();
}

export { bot as telegram };
