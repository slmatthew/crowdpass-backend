import { prisma } from "../db/prisma";

export async function getSummary() {
  const [ticketCount, soldTicketCount, eventCount, userCount, bookingCount] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "SOLD" } }),
    prisma.event.count(),
    prisma.user.count(),
    prisma.booking.count(),
  ]);

  return {
    ticketCount,
    soldTicketCount,
    eventCount,
    userCount,
    bookingCount,
  };
}