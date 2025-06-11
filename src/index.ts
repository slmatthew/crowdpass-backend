import dotenv from "dotenv";

const ENV_PATH = process.env.NODE_ENV === 'development' ? '.env.dev' : '.env';

console.info('ℹ️', 'NODE_ENV:', process.env.NODE_ENV);
console.info('ℹ️', '.env path:', ENV_PATH);

dotenv.config({
  path: ENV_PATH,
});

import { prisma } from "./db/prisma";
import { startTelegramBot, telegram } from "./bots/telegram/";
import { startVkBot, vk } from "./bots/vk";
import { startApiServer } from "./api";
import { MessageQueueService } from "./services/messageQueueService";
import { scheduleExpiredBookingCleanup } from "./utils/schedulers/cleanupExpiredBookings";
import { prepareRootSetup } from "./utils/checkRoot";

let shuttingDown = false;

async function main() {
  MessageQueueService.start();
  scheduleExpiredBookingCleanup();

  await prepareRootSetup();

  await startApiServer();
  await startTelegramBot();
  await startVkBot();

  console.log("✅ Все сервисы успешно запущены");
}

async function shutdown() {
  if(shuttingDown) return;
  shuttingDown = true;

  console.log("🧹 Завершение работы...");

  try {
    await telegram.stop();
    if(vk) await vk.updates.stop();

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
