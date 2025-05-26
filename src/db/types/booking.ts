import { Prisma } from "@prisma/client";

export const sharedBooking = Prisma.validator<Prisma.BookingDefaultArgs>()({
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

export type SharedBooking = Prisma.BookingGetPayload<
  typeof sharedBooking
>;