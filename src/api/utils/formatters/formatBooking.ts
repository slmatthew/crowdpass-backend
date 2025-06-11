import { prisma } from "../../../db/prisma";
import { Booking } from "@prisma/client";
import { FormatOptions } from "./formatOptions";

export async function formatBooking(booking: Booking & {
  user?: any;
  bookingTickets?: any[];
}, options: FormatOptions = {}) {
  const { extended, fields = [] } = options;

  const result: any = {
    id: booking.id,
    userId: booking.userId,
    status: booking.status,
    createdAt: booking.createdAt,
  };

  if(!extended) return result;

  if(fields.includes("user")) {
    result.user = booking.user ?? await prisma.user.findUnique({
      where: { id: booking.userId },
    });
  }

  if(fields.includes("bookingTickets")) {
    result.bookingTickets = booking.bookingTickets ?? await prisma.bookingTicket.findMany({
      where: { bookingId: booking.id },
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
    });
  }

  return result;
}