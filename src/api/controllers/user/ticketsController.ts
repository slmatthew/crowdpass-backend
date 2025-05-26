import { XEventConvert, XEventShort, XTicketShort, XTicketType, XTicketTypeFormat } from "@/api/types/responses";
import { BookingService } from "@/services/bookingService";
import { TicketService } from "@/services/ticketService";
import { Booking, Ticket, TicketType, Event } from "@prisma/client";
import { Request, Response } from "express";

type DisplayBooking = Omit<Booking, 'bookingTickets' | 'user'>;
type DisplayTicketType = Omit<TicketType, 'event' | 'quantity'>;

export async function myTickets(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });

  const bookings = await BookingService.getByUserId(req.user.id, 'PAID');
  
  const dEvents = new Map<number, XEventShort>();
  const dBookings = new Map<number, DisplayBooking>();
  const dTicketTypes = new Map<number, XTicketType>();
  const dTickets: XTicketShort[] = [];

  for(const b of bookings) {
    dBookings.set(b.id, {
      id: b.id,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      userId: b.userId,
      status: b.status,
    });

    for(const bt of b.bookingTickets) {
      const { ticketType: tTicketType, ...ticket } = bt.ticket;
      const { event, quantity, ...ticketType } = tTicketType;
      if(event) {
        if(Date.now() >= new Date(event.endDate).getTime()) {
          continue;
        }

        dEvents.set(event.id, XEventConvert.toShort(event));
        dTicketTypes.set(bt.ticket.ticketType.id, XTicketTypeFormat.default(tTicketType));

        let purchaseDate = null;
        try { purchaseDate = await TicketService.getTicketPurchaseDate(ticket, b); } catch {}

        dTickets.push({
          id: ticket.id,
          qrCodeSecret: ticket.qrCodeSecret,
          ownerFirstName: ticket.ownerFirstName,
          ownerLastName: ticket.ownerLastName,
          status: ticket.status,
          ticketTypeId: ticket.ticketTypeId,
          bookingId: b.id,
          purchaseDate,
        });
      }
    }
  }

  dBookings.forEach(b => {
    if(!dTickets.find(t => t.bookingId === b.id)) dBookings.delete(b.id);
  });

  res.json({
    tickets: dTickets,
    ticketTypes: Array.from(dTicketTypes.values()),
    bookings: Array.from(dBookings.values()),
    events: Array.from(dEvents.values()),
  });
}