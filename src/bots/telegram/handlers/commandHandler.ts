import { SharedContext } from "@/types/grammy/SessionData";
import { Api, Bot, RawApi } from "grammy";
import * as cmd from "../commands";
import { setPhone } from "../controllers/userController";
import { ControllerContext } from "../controllers/ControllerContext";

export function handleCommands(bot: Bot<SharedContext, Api<RawApi>>) {
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

  bot.on('message:contact', ctx => setPhone(ctx as ControllerContext));
}