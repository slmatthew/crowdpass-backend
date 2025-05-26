import { convertBookingToUserBooking, UserBooking } from "@/api/types/UserBooking";
import { telegram } from "@/bots/telegram";
import { currencyCache } from "@/bots/telegram/utils/currencyCache";
import { formatAmount } from "@/bots/telegram/utils/formatAmount";
import { BookingService } from "@/services/bookingService";
import { BookingError } from "@/types/errors/BookingError";
import { Request, Response } from "express";
import { features } from "@/services/featuresService";
import { XBooking, XBookingEvent, XMyBookingsResponse, XTicketType, XTicketTypeFormat } from "@/api/types/responses";

export async function myBookings(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });
  
  const bookings = await BookingService.getByUserId(req.user.id);
  
  const rBookings: XBooking[] = [];
  const rTicketTypes = new Map<number, XTicketType>();
  const rEvents = new Map<number, XBookingEvent>();

  bookings.forEach(b => {
    const tickets = b.bookingTickets.map(bt => {
      if(!rTicketTypes.has(bt.ticket.ticketType.id)) {
        rTicketTypes.set(bt.ticket.ticketType.id, XTicketTypeFormat.default(bt.ticket.ticketType));
      }
      if(!rEvents.has(bt.ticket.ticketType.event.id)) {
        rEvents.set(bt.ticket.ticketType.event.id, {
          id: bt.ticket.ticketType.event.id,
          slug: bt.ticket.ticketType.event.slug,
          name: bt.ticket.ticketType.event.name,
          description: bt.ticket.ticketType.event.description,
          startDate: bt.ticket.ticketType.event.startDate,
          endDate: bt.ticket.ticketType.event.endDate,
          location: bt.ticket.ticketType.event.location,
          posterUrl: bt.ticket.ticketType.event.posterUrl
        });
      }

      return {
        id: bt.ticket.id,
        ticketTypeId: bt.ticket.ticketTypeId,
        qrCodeSecret: bt.ticket.qrCodeSecret,
        ownerFirstName: bt.ticket.ownerFirstName,
        ownerLastName: bt.ticket.ownerLastName,
        status: bt.ticket.status,
      };
    });

    rBookings.push({
      id: b.id,
      createdAt: b.createdAt,
      status: b.status,
      tickets,
    });
  });

  const result: XMyBookingsResponse = {
    bookings: rBookings,
    ticketTypes: Array.from(rTicketTypes.values()),
    events: Array.from(rEvents.values()),
  };

  res.json(result);
}

export async function getTelegramInvoiceLink(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });
  if(
    (features.isTelegramPaymentsWorking() && !features.isTelegramPaymentsTesting()) ||
    !features.isTelegramPaymentsWorking()
  ) {
    return res.status(418).json({ message: 'Оплата недоступна' });
  }

  const id = Number(req.params.id);
  const booking = await BookingService.getById(id);
  if(!booking) return res.status(404).json({ message: 'Бронирование не найдено' });

  if(booking.userId !== req.user.id) return res.status(403).json({ message: 'Вы не можете отменить это бронирование' });
  if(booking.status !== 'ACTIVE') return res.status(403).json({ message: 'Бронирование уже оплачено или отменено' });
  if(booking.bookingTickets.length === 0) return res.status(400).json({ message: 'Это бронирование невозможно оплатить' });

  const events: string[] = [];
  booking.bookingTickets.forEach(bt => {
    const str = `«${bt.ticket.ticketType.event.name}»`;
    if(events.includes(str)) return;

    events.push(`«${bt.ticket.ticketType.event.name}»`);
  });

  const event = events.join(', ');
  
  let price: number = 0;
  const labeledPrice: { label: string, amount: number }[] = [];
  for(const bkTicket of booking.bookingTickets) {
    price += Number(bkTicket.ticket.ticketType.price);
    labeledPrice.push({
      label: `${bkTicket.ticket.ticketType.name} #${bkTicket.ticket.ticketType.event.id}-${bkTicket.ticket.id}`,
      amount: Number(bkTicket.ticket.ticketType.price) * 100
    });
  }
  price = price * 100;

  const currency = await currencyCache.getCurrency();
  if(price <= Number(currency.min_amount) || price >= Number(currency.max_amount)) {
    return res.status(400).json({ message: 'К сожалению, это бронирование невозможно оплатить через Telegram' });
  }
  
  const link = await telegram.api.createInvoiceLink(
    `CrowdPass №B${booking.id}`,
    `Ваше бронирование №${booking.id} включает в себя билеты (${booking.bookingTickets.length} шт.) на мероприятие(-я) ${event} общей стоимостью ${formatAmount(price, currency)}`, 
    `${booking.id}-${req.user.id}-booking`, 
    features.getTelegramPaymentsToken()!, 
    'RUB', 
    labeledPrice
  );

  res.json({ link });
}

export async function cancelBooking(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });

  const id = Number(req.params.id);
  const booking = await BookingService.getById(id);
  if(!booking) return res.status(404).json({ message: 'Бронирование не найдено' });

  if(booking.userId !== req.user.id) return res.status(403).json({ message: 'Вы не можете отменить это бронирование' });
  if(booking.status !== 'ACTIVE') return res.status(403).json({ message: 'Бронирование уже оплачено или отменено' });

  await BookingService.cancelBooking(booking.id);
  return res.status(204).send();
}

export async function make(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });

  const tickets: { ticketTypeId: number, quantity: number }[] = req.body.tickets;
  if(!Array.isArray(tickets) || tickets.length === 0) return res.status(400).json({ message: 'Некорректный формат запроса' });

  for(const ticket of tickets) {
    if(
      !ticket.ticketTypeId ||
      typeof ticket.ticketTypeId !== 'number' ||
      !Number.isInteger(ticket.ticketTypeId) ||
      !ticket.quantity ||
      typeof ticket.quantity !== 'number' ||
      ticket.quantity <= 0 ||
      !Number.isInteger(ticket.quantity)
    ) return res.status(422).json({ message: 'Некорректные значения' });
  }
  
  try {
    const booking = await BookingService.makeBooking(req.user.id, tickets);

    res.json({ ok: true, bookingId: booking.id });
  } catch(err: any) {
    if(err instanceof BookingError) return res.status(500).json({ message: err.message, metadata: err.metadata });

    console.error(err);
    res.status(500).json({ message: "Произошла ошибка" });
  }
}