import { Bot } from "grammy";
import { CallbackQueryContext } from "grammy/out/context";
import { CallbackAction } from "../constants/callbackActions";
import { SharedContext } from "@/types/grammy/SessionData";

export function handlePayload<T extends any[]>(
  bot: Bot<SharedContext>,
  action: CallbackAction,
  handler: (ctx: CallbackQueryContext<SharedContext & { match: T }>, ...args: T) => any | Promise<any>
) {
  const pattern = new RegExp(`^${action}_(.+)$`);

  bot.callbackQuery(pattern, async (ctx) => {
    const raw = ctx.match?.[1];
    const parts = raw?.split("_") ?? [];

    const parsed = parts.map((p) => (isNaN(Number(p)) ? p : Number(p))) as T;

    (ctx as any).match = parsed;
    await handler(ctx as any, ...parsed);
  });
}