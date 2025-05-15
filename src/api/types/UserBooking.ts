import { Booking, BookingStatus, BookingTicket, Ticket, TicketStatus, TicketType, User, Event } from "@prisma/client";

export interface UserTicket {
  id: number;
  ticketTypeId: number;
  ownerFirstName?: string;
  ownerLastName?: string;
  status: TicketStatus;
  ticketType: TicketType & { event: Event };
  bookingTickets?: UserBookingTicket[];
}

export interface UserBookingTicket {
  id: number;
  bookingId: number;
  ticketId: number;
  booking?: UserBooking;
  ticket: UserTicket;
}

export interface UserBooking {
  id: number;
  userId: number;
  createdAt: Date;
  status: BookingStatus;
  user: User;
  bookingTickets: UserBookingTicket[];
}

type SharedTicket = Ticket & { ticketType?: TicketType; bookingTickets?: BookingTicket[] };

type SharedBookingTicket = BookingTicket & { booking?: Booking; ticket: SharedTicket; };

export type SharedBooking = Booking & {
  user?: User;
  bookingTickets?: SharedBookingTicket[];
};

export function convertBookingToUserBooking(booking: SharedBooking): UserBooking {
  return {
    id: booking.id,
    userId: booking.userId,
    createdAt: booking.createdAt,
    status: booking.status,
    user: booking.user,
    bookingTickets: booking.bookingTickets?.map(bt => ({
      id: bt.id,
      bookingId: bt.bookingId,
      ticketId: bt.ticketId,
      booking: bt.booking,
      ticket: {
        id: bt.ticket.id,
        ticketTypeId: bt.ticket.ticketTypeId,
        ownerFirstName: bt.ticket.ownerFirstName,
        ownerLastName: bt.ticket.ownerLastName,
        status: bt.ticket.status,
        ticketType: bt.ticket.ticketType,
      }
    } as UserBookingTicket))
  } as UserBooking;
}