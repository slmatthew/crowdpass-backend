import { Bot, Api, RawApi, InlineKeyboard } from "grammy";
import { extraGoToHomeKeyboard } from "../constants/extraGoToHomeKeyboard";
import { SharedContext } from "@/types/grammy/SessionData";
import { vk } from "@/bots/vk";
import { UserService } from "@/services/userService";
import { Platform } from "@prisma/client";
import { UserError } from "@/types/errors/UserError";
import { sendLinkRequest } from "@/bots/core/utils/sendLinkRequest";
import { TicketService } from "@/services/ticketService";
import { bookingSessionService } from "@/bots/core/services/BookingSessionService";
import { TelegramStrategy } from "../controllers/TelegramStrategy";

export function handleText(bot: Bot<SharedContext, Api<RawApi>>) {
  bot.on("message:text", async (ctx) => {
    if(ctx.session?.step === 'link.awaiting_vk') {
      const user = ctx.sfx.user;
      if(!user) return await ctx.reply('Произошла ошибка, попробуйте позже');

      const input = ctx.message.text.trim();

      const cleaned = input
        .replace(/^https?:\/\/(www\.)?vk\.com\//i, '')
        .replace(/^@/, '')
        .trim();

      try {
        const [vkProfile] = await vk.api.users.get({ user_ids: [cleaned], fields: ['verified'] });
        const vkId = vkProfile.id.toString();

        const canWriteMessage = await vk.api.messages.isMessagesFromGroupAllowed({
          user_id: vkProfile.id,
          group_id: Number(process.env.VK_BOT_ID!)
        });

        if(!canWriteMessage.is_allowed) return await ctx.reply('❌ Сейчас бот не может отправить вам сообщение ВКонтакте. Напишите ему – и всё получится: vk.me/crowdpass');

        const { code, targetUser } = await UserService.startLinkProcedure({
          sourceUserId: user?.id,
          targetPlatform: Platform.VK,
          targetIdentifier: vkId
        });

        await sendLinkRequest(Platform.VK, vkProfile.id, code);

        await ctx.reply('✅ Запрос отправлен. Подтверди его в VK.');
      } catch(err) {
        if(err instanceof UserError) {
          console.error(`[tg/LinkCommand/${err.code}] ${err.message}`, err.metadata);
          await ctx.reply(`❗ ${err.message}`);
        } else {
          console.error('[tg/LinkCommand]', err);
          await ctx.reply('❗ Произошла ошибка, попробуйте позже');
        }
      } finally {
        ctx.session.step = null;
      }

      return;
    }

    const user = ctx.sfx.user!;
    const session = bookingSessionService.getSession(user.id);
  
    if (!session || !session.ticketTypeId || session.step !== 'ask_count') {
      return await ctx.reply("❓ Я не понял вас.\n\nПожалуйста, используйте команды или напишите /help для списка доступных команд.", extraGoToHomeKeyboard);
    }
  
    const count = parseInt(ctx.message.text.trim());
  
    if (isNaN(count) || count <= 0) {
      await ctx.reply("Пожалуйста, отправьте корректное положительное число или /cancel для отмены");
      return;
    }
  
    const availableTickets = await TicketService.getAvailableTickets(session.ticketTypeId, count);
  
    if (availableTickets.length < count) {
      await ctx.reply(`😔 Недостаточно свободных билетов. Доступно только ${availableTickets.length}`);
      return;
    }

    bookingSessionService.setSession(user.id, { ...session, step: 'end', ticketsCount: count });

    const keyboard = new InlineKeyboard()
      .text("✅ Подтвердить", TelegramStrategy.callbackPayloads.bookingConfirm(user.id) as string)
      .text("❌ Отменить", TelegramStrategy.callbackPayloads.bookingCancel(user.id) as string);

    await ctx.react('👌');

    await ctx.reply(`Вы хотите забронировать *${count}* билет(ов).\nПожалуйста, подтвердите действие:`, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  });
}