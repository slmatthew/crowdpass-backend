import { prisma } from "./db/prisma";
import { startTelegramBot } from "./bots/telegram/";
import { startVkBot } from "./bots/vk";
import { startApiServer } from "./api";

async function main() {
  startTelegramBot();
  startVkBot();
  startApiServer();
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
