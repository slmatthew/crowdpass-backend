import cron from "node-cron";
import { prisma } from "@/db/prisma";
import { Platform } from "@prisma/client";
import { telegram } from "@/bots/telegram";
import { vk } from "@/bots/vk";
import { BookingStatus } from "@prisma/client";
import { MessageQueueService } from "@/services/messageQueueService";

export function scheduleExpiredBookingCleanup() {
  cron.schedule("*/10 * * * *", async () => {
    const now = new Date();

    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.ACTIVE,
        bookingTickets: {
          some: {
            ticket: {
              ticketType: {
                event: {
                  endDate: { lt: now },
                },
              },
            },
          },
        },
      },
      include: {
        user: true,
        bookingTickets: {
          include: {
            ticket: {
              include: {
                ticketType: {
                  include: {
                    event: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if(expiredBookings.length === 0) return;

    const idsToCancel = expiredBookings.map((b) => b.id);
    await prisma.booking.updateMany({
      where: { id: { in: idsToCancel } },
      data: { status: BookingStatus.CANCELLED },
    });

    for (const booking of expiredBookings) {
      const eventNames = Array.from(
        new Set(
          booking.bookingTickets.map((bt) => bt.ticket.ticketType.event.name)
        )
      );

      const message = `❌ Ваша бронь была отменена, так как мероприятие уже завершилось.\n\n${eventNames
        .map((n) => `• ${n}`)
        .join("\n")}`;

      try {
        let telegramSent = false;
        if(booking.user.telegramId) {
          MessageQueueService.enqueue({
            platform: "telegram",
            recipientId: booking.user.telegramId,
            text: message,
          });
          telegramSent = true;
        }

        if(booking.user.vkId && !telegramSent) {
          MessageQueueService.enqueue({
            platform: "vk",
            recipientId: booking.user.vkId,
            text: message,
          });
        }
      } catch (err) {
        console.error(
          `[cron/notify_user_failed] userId=${booking.user.id}:`,
          err
        );
      }
    }

    console.log(`[cron] Отменено просроченных броней: ${expiredBookings.length}`);
  });
}