import { convertBookingToUserBooking, SharedBooking, UserBooking, UserBookingTicket } from "@/api/types/UserBooking";
import { telegram } from "@/bots/telegram";
import { currencyCache } from "@/bots/telegram/utils/currencyCache";
import { formatAmount } from "@/bots/telegram/utils/formatAmount";
import { BookingService } from "@/services/bookingService";
import { Request, Response } from "express";

const TELEGRAM_PAYMENTS_LIVE = process.env.NODE_ENV !== 'development';
const TELEGRAM_PAYMENTS_TOKEN = TELEGRAM_PAYMENTS_LIVE ? process.env.TELEGRAM_PAYMENTS_LIVE_TOKEN : process.env.TELEGRAM_PAYMENTS_TEST_TOKEN;

export async function myBookings(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });
  
  const bookings = await BookingService.getByUserId(req.user.id);
  const displayBookings: UserBooking[] = bookings.map(convertBookingToUserBooking);

  res.json(displayBookings);
}

export async function getTelegramInvoiceLink(req: Request, res: Response) {
  if(!req.user) return res.status(401).json({ message: 'Невозможно получить данные' });

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
    TELEGRAM_PAYMENTS_TOKEN!, 
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