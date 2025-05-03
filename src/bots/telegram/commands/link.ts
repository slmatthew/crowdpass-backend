import { SharedContext } from "@/types/grammy/SessionData";

export const linkCommand = async (ctx: SharedContext) => {
  if(ctx.sfx.user?.vkId) return await ctx.reply(
    `Вы уже добавили свой [аккаунт ВКонтакте](https://vk.com/id${ctx.sfx.user.vkId}).

Если вам необходимо изменить привязку – обратитесь в поддержку с помощью /support`,
    { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } }
  );

  ctx.session.step = 'link.awaiting_vk';
  await ctx.reply('Введи свой VK ID (цифрами) или ссылку на профиль:');
};