import { Request, Response } from "express";
import { BookingService } from "../../../services/bookingService";
import { TicketService } from "../../../services/ticketService";
import { BookingStatus, Role, TicketStatus } from "@prisma/client";
import { BookingError } from "@/types/errors/BookingError";
import { logAction } from "../../../utils/logAction";
import { ActionLogAction } from "@/constants/appConstants";
import { SharedBooking } from "@/db/types";

type bcBooking = {
  id: number;
  userId: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  tickets: {
    id: number;
    status: TicketStatus;
    owner: {
      fn: string | null;
      ln: string | null;
    };
    ticketTypeId: number;
  }[];
};

type bcUser = {
  id: number;
  telegramId: string | null;
  vkId: string | null;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: Date;
  isBanned: boolean;
};

type bcTicketType = {
  id: number;
  slug: string | null;
  name: string;
  price: number;
  eventId: number;
  isActive: boolean;
};

type bcEvent = {
  id: number;
  slug: string | null;
  name: string;
  isActive: boolean;
};

function _getBookings(data: {
    bookings: SharedBooking[];
    total: number;
}): {
  bookings: {
    items: bcBooking[];
    total: number;
  },
  events: bcEvent[];
  ticketTypes: bcTicketType[];
  users: bcUser[];
} {
  const rBookings: bcBooking[] = [];

  const rUsers = new Map<number, bcUser>();
  const rTicketTypes = new Map<number, bcTicketType>();
  const rEvents = new Map<number, bcEvent>();

  data.bookings.forEach(b => {
    if(!rUsers.has(b.userId)) {
      rUsers.set(b.userId, {
        id: b.userId,
        telegramId: b.user.telegramId,
        vkId: b.user.vkId,
        email: b.user.email,
        firstName: b.user.firstName,
        lastName: b.user.lastName,
        phone: b.user.phone,
        createdAt: b.user.createdAt,
        isBanned: b.user.isBanned,
      });
    }

    const tickets = b.bookingTickets.map(bt => {
      if(!rTicketTypes.has(bt.ticket.ticketTypeId)) rTicketTypes.set(bt.ticket.ticketTypeId, {
        id: bt.ticket.ticketType.id,
        slug: bt.ticket.ticketType.slug,
        name: bt.ticket.ticketType.name,
        price: Number(bt.ticket.ticketType.price),
        eventId: bt.ticket.ticketType.eventId,
        isActive: bt.ticket.ticketType.isSalesEnabled && !bt.ticket.ticketType.isDeleted,
      });

      if(!rEvents.has(bt.ticket.ticketType.eventId)) rEvents.set(bt.ticket.ticketType.eventId, {
        id: bt.ticket.ticketType.event.id,
        slug: bt.ticket.ticketType.event.slug,
        name: bt.ticket.ticketType.event.name,
        isActive: bt.ticket.ticketType.event.isPublished &&
                  bt.ticket.ticketType.event.isSalesEnabled &&
                  !bt.ticket.ticketType.event.isDeleted,
      });

      return {
        id: bt.ticket.id,
        status: bt.ticket.status,
        owner: {
          fn: bt.ticket.ownerFirstName,
          ln: bt.ticket.ownerLastName,
        },
        ticketTypeId: bt.ticket.ticketTypeId,
      };
    });

    rBookings.push({
      id: b.id,
      userId: b.userId,
      status: b.status,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      tickets,
    });
  });

  return {
    bookings: {
      items: rBookings,
      total: data.total,
    },
    events: Array.from(rEvents.values()),
    ticketTypes: Array.from(rTicketTypes.values()),
    users: Array.from(rUsers.values()),
  };
}

export async function getBookings(req: Request, res: Response) {
  const { status, userId, eventId, page, limit } = req.query;
  const data = await BookingService.getAll({
    status: status as BookingStatus | undefined,
    userId: userId ? Number(userId) : undefined,
    eventId: eventId ? Number(eventId) : undefined,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });

  res.json(_getBookings(data));
}

export async function getBookingById(req: Request, res: Response) {
  const id = Number(req.params.id);

  const booking = await BookingService.getById(id);
  if(!booking) return res.status(404).json({ message: "Booking not found" });

  res.json(_getBookings({
    bookings: [booking],
    total: 1
  }));
}

export async function updateBookingStatus(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { status } = req.body;

  if(!["ACTIVE", "CANCELLED", "PAID"].includes(status)) return res.status(400).json({ message: 'Некорректный статус' });

  const allowStatusChange = await BookingService.canUserManageBooking(req.user?.id || 0, id);

  try {
    await BookingService.updateStatus(id, status, allowStatusChange);

    logAction({
      actorId: req.user?.id || 0,
      action: ActionLogAction.BOOKING_STATUS_UPDATE,
      targetId: id,
      targetType: 'booking',
      metadata: {
        status,
      }
    });

    if(status === 'PAID') {
      BookingService.logBookingPaid(
        req.user?.id || 0,
        id,
        {
          source: 'ap',
          forced: true,
          amount: 0,
        }
      );
    }

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