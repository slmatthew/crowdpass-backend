import { UserService } from "@/services/userService";
import { Bot, session } from "grammy";
import * as cmd from "./commands";
import { handleBookingCallbacks } from "./handlers/bookingHandlers";
import { handleTicketCallbacks } from "./handlers/ticketHandlers";
import { handleNavigationCallbacks } from "./handlers/navigationHandlers";
import { handleText } from "./handlers/textHandlers";
import { SharedContext, SessionData } from "@/types/grammy/SessionData";
import { handleEventsCallbacks } from "./handlers/eventsHandlers";

const bot = new Bot<SharedContext>(process.env.TELEGRAM_BOT_TOKEN as string);

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
bot.command('start', cmd.startCommand);
bot.command('help', cmd.helpCommand);

bot.command('about', cmd.aboutCommand);
bot.command('support', cmd.supportCommand);

bot.command('link', cmd.linkCommand);

bot.command('events', cmd.eventsCommand);
bot.command('mytickets', cmd.myticketsCommand);
bot.command('mybookings', cmd.mybookingsCommand);
bot.command('cancel', cmd.cancelCommand);

bot.command('test', cmd.testCommand);

/* callbacks */
handleNavigationCallbacks(bot);
handleEventsCallbacks(bot);
handleBookingCallbacks(bot);
handleTicketCallbacks(bot);

/* text */
handleText(bot);

bot.catch((err) => {
  console.error("Ошибка в боте:", err.error);
});

export function startTelegramBot() {
  console.log("🚀 Telegram bot running");
  bot.start();
}

export { bot as telegram };
