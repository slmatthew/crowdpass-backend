import { Api, Bot, RawApi } from "grammy";
import { SharedContext } from "@/types/grammy/SessionData";
import { CallbackAction } from "../constants/callbackActions";
import { sendHome } from "../controllers/navigationController";

export function handleNavigationCallbacks(bot: Bot<SharedContext, Api<RawApi>>) {
  bot.callbackQuery(CallbackAction.GO_HOME, sendHome);
}