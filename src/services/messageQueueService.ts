import { telegram } from "@/bots/telegram";
import { vk } from "@/bots/vk";

type MessagePlatform = "telegram" | "vk";

interface QueuedMessage {
  platform: MessagePlatform;
  recipientId: string;
  text: string;
}

const queue: QueuedMessage[] = [];

export class MessageQueueService {
  static enqueue(message: QueuedMessage) {
    queue.push(message);
  }

  static start() {
    setInterval(async () => {
      const item = queue.shift();
      if (!item) return;

      try {
        switch (item.platform) {
          case "telegram":
            await telegram.api.sendMessage(item.recipientId, item.text);
            break;
          case "vk":
            await vk.api.messages.send({
              user_id: Number(item.recipientId),
              message: item.text,
              random_id: Date.now(),
            });
            break;
        }
      } catch (err) {
        console.error(`[MessageQueue][${item.platform}] Failed to send to ${item.recipientId}`, err);
      }
    }, 150); // 6–7 msg per second
  }
}