import { Request, Response } from "express";
import { UserService } from "@/services/user.service";
import { AdminDashboardService } from "@/services/adminDashboardService";
import { TicketService } from "@/services/ticketService";
import { privileges } from "@/api/utils/privileges";

export const dashboardController = {
  async getSummary(req: Request, res: Response) {
    const { ticketCount, soldTicketCount, eventCount, userCount, bookingCount } = await AdminDashboardService.getSummary();

    res.json({
      totalTickets: ticketCount,
      soldTickets: soldTicketCount,
      totalEvents: eventCount,
      totalUsers: userCount,
      totalBookings: bookingCount,
    });
  },
  async getMe(req: Request, res: Response) {
    const userId = req.user?.id;

    if(!userId) {
      return res.status(401).json({ message: 'Не найден id пользователя' });
    }

    const user = await UserService.findById(userId);

    if(!user || !user.admin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    res.json(user);
  },
  async validateTicket(req: Request, res: Response) {
    const { secret, ticketCode, makeUsed } = req.body;
    if(secret === undefined && ticketCode === undefined) return res.status(404).json({ message: 'Билет не найден' });

    let ticket;

    if(ticketCode !== undefined) {
      const [eventId, ticketId] = ticketCode.split("-").map(Number);
      if(!eventId || !ticketId) return res.status(400).json({ message: 'Неверный формат номера' });

      ticket = await TicketService.findTicketByEventAndTicketIds(eventId, ticketId);
    } else {
      ticket = await TicketService.findTicketBySecret(secret);
    }

    if(!ticket) return res.status(404).json({ message: 'Билет не найден' });

    const now = new Date();
    const event = ticket.ticketType.event;

    if(!(await privileges.organizers.updateAndValidate(req.user!, event.organizerId))) {
      return res.status(403).json({ message: 'Вы не можете проверять билеты на этом мероприятии' });
    }
    
    const result = {
      secret: ticket.qrCodeSecret,
      status: ticket.status,
      ticketId: ticket.id,
      ticketType: {
        id: ticket.ticketType.id,
        name: ticket.ticketType.name,
        price: ticket.ticketType.price,
      },
      event: {
        id: event.id,
        name: event.name,
      },
    } as any;

    if(event.endDate.getTime() < now.getTime()) {
      result.allowed = false;
      result.message = 'Мероприятие уже завершено';

      return res.json(result);
    }

    const isPaidBooking = ticket.bookingTickets.some(
      (bt) => bt.booking.status === "PAID"
    );

    if(!isPaidBooking) {
      result.allowed = false;
      result.message = 'Билет не оплачен';

      return res.json(result);
    }

    if(ticket.status !== "SOLD") {
      result.allowed = false;
      result.message = 'Билет имеет некорректный статус';

      return res.json(result);
    }
    
    if(makeUsed === '1' || makeUsed === 'true') {
      await TicketService.updateStatus(ticket.id, 'USED');
      result.status = 'USED';
    }

    result.allowed = true;

    res.json(result);
  },
  async getRegistersByDay(req: Request, res: Response) {
    const result = await AdminDashboardService.getRegistersByDay();
    res.json(result);
  },
};