import { prisma } from "./db/prisma";
import { startTelegramBot, telegram } from "./bots/telegram/";
import { startVkBot, vk } from "./bots/vk";
import { startApiServer } from "./api";
import { MessageQueueService } from "./services/messageQueueService";
import { scheduleExpiredBookingCleanup } from "./utils/schedulers/cleanupExpiredBookings";

let shuttingDown = false;

async function main() {
  MessageQueueService.start();
  scheduleExpiredBookingCleanup();

  await startApiServer();
  await startTelegramBot();
  await startVkBot();

  console.log("✅ Все сервисы успешно запущены");
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("🧹 Завершение работы...");

  try {
    // Останавливаем ботов
    await telegram.stop();
    await vk.updates.stop();

    // TODO: остановка очередей/таймеров, если надо
    // MessageQueueService.stop();

    await prisma.$disconnect();
    console.log("✅ Shutdown завершён");
    process.exit(0);
  } catch (err) {
    console.error("❌ Ошибка при завершении:", err);
    process.exit(1);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch(async (err) => {
  console.error("🔥 Ошибка при запуске:", err);
  await shutdown();
});
