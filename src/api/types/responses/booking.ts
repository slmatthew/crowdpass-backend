import {
	BookingStatus,
	TicketStatus,
} from "@prisma/client";
import { XTicketType } from "./ticketType";

export type XBookingTicket = {
	id: number;
  ticketTypeId: number;
  qrCodeSecret: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  status: TicketStatus;
};

export type XBooking = {
	id: number;
	createdAt: Date;
	status: BookingStatus;
	tickets: XBookingTicket[];
};

export type XBookingEvent = {
	id: number;
	slug: string | null;
	name: string;
	description: string;
	startDate: Date;
	endDate: Date;
	location: string;
	posterUrl: string | null;
};

export type XMyBookingsResponse = {
	bookings: XBooking[];
	ticketTypes: XTicketType[];
	events: XBookingEvent[];
};