import { Request, Response } from "express";
import { BookingService } from "../../../services/bookingService";
import { TicketService } from "../../../services/ticketService";
import { BookingStatus, Role } from "@prisma/client";
import { BookingError } from "@/types/errors/BookingError";
import { logAction } from "../../../utils/logAction";

export async function getBookings(req: Request, res: Response) {
  const { status, userId, eventId, page, limit } = req.query;
  const data = await BookingService.getAll({
    status: status as BookingStatus | undefined,
    userId: userId ? Number(userId) : undefined,
    eventId: eventId ? Number(eventId) : undefined,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });
  res.json(data);
}

export async function getBookingById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const booking = await BookingService.getById(id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
}

export async function updateBookingStatus(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { status } = req.body;

  const allowStatusChange = await BookingService.canUserManageBooking(req.user?.id || 0, id);

  try {
    await BookingService.updateStatus(id, status, allowStatusChange);

    logAction({
      actorId: req.user?.id || 0,
      action: 'booking.status.update',
      targetId: id,
      targetType: 'booking',
      metadata: {
        status,
      }
    });

    /* format? */
    getBookingById(req, res);
  } catch(err) {
    if (err instanceof BookingError) {
      // console.error(`[updateBookingStatus/${err.code}] ${err.message}`, err.metadata);
      return res.status(400).json({ message: err.message });
    }

    console.error("updateBookingStatus:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateTicketStatus(req: Request, res: Response) {
  const ticketId = Number(req.params.ticketId);
  const { status } = req.body;
  const updated = await TicketService.updateStatus(ticketId, status);
  res.json(updated);
}