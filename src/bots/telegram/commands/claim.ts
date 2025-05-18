import { SharedContext } from "@/types/grammy/SessionData";
import { CommandContext } from "grammy";
import { TelegramStrategy } from "../controllers/TelegramStrategy";
import { CoreUsersController } from "@/bots/core/controllers/CoreUsersController";
import { logAction } from "@/utils/logAction";

const controller = new CoreUsersController(TelegramStrategy);

export const claimCommand = async (ctx: CommandContext<SharedContext>) => {
  if(!ctx.sfx.user) return ctx.reply('Нет информации о пользователе');
  
  const parts = ctx.message!.text.trim().split(" ");

  if(parts.length < 2) {
    return ctx.reply("Пожалуйста, укажите код: /claim <код>");
  }

  const providedCode = parts[1].toUpperCase();
  const result = await controller.rootPurpose(ctx.sfx.user, providedCode);

  if(result.ok) await logAction({
    actorId: ctx.sfx.user.id,
    action: 'system.root-purpose',
    targetType: 'user',
    targetId: ctx.sfx.user.id,
    metadata: { code: providedCode },
  });

  TelegramStrategy.doActionReply(ctx, await controller.rootPurpose(ctx.sfx.user, providedCode));
};