import { MessageContext } from "vk-io";
import { CallbackAction } from "@/bots/core/constants/callbackActions";
import { VkRouter } from "@/bots/vk/routers/router";

export function handlePayload<T extends any[]>(
  router: VkRouter,
  action: CallbackAction,
  handler: (ctx: MessageContext & { sfxMatch: T }, ...args: T) => any | Promise<any>
) {
  const pattern = new RegExp(`^${action}_(.+)$`);

  router.registerPayloadPattern(pattern, async (ctx, match) => {
    const raw = match[1];
    const parts = raw?.split("_") ?? [];

    const parsed = parts.map((p) => (isNaN(Number(p)) ? p : Number(p))) as T;

    ctx.sfxMatch = parsed;
    await handler(ctx as any, ...parsed);
  });
}