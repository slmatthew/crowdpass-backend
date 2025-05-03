export async function deleteAfter(ctx: any, messageId: number, delayMs: number = 15000) {
  setTimeout(async () => {
    try {
      await ctx.api.deleteMessage(ctx.chat.id, messageId);
    } catch (error) {
      console.error("Ошибка при удалении сообщения:", error);
    }
  }, delayMs);
}
