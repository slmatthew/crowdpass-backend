import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { UserService } from "../../../services/userService";
import { AdminDashboardService } from "../../../services/adminDashboardService";
import { OrganizerService } from "../../../services/organizerService";

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

    if (!userId) {
      return res.status(401).json({ message: 'Не найден id пользователя' });
    }

    const user = await UserService.findUserById(userId);

    if (!user || !user.admin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    res.json(user);
  },

  /**
   * @TODO перекинуть это все в отдельные контроллеры
   * @TODO убрать вызовы напрямую к БД
   */
  async getOrganizers(req: Request, res: Response) {
    if(req.user?.role === 'MANAGER') {
      const user = await UserService.findUserById(req.user.id);
  
      const organizerId = user?.admin?.organizerId;
      if(organizerId) {
        const organizers = await OrganizerService.getAdminAvailableOrganizers(organizerId);
        return res.json(organizers);
      }
    }
  
    const organizers = await OrganizerService.getAdminAvailableOrganizers();
    res.json(organizers);
  },
  async getCategories(req: Request, res: Response) {
    const categories = await prisma.category.findMany();
    res.json(categories);
  },
  async getSubcategories(req: Request, res: Response) {
    const categoryId = req.params.categoryId
      ? parseInt(req.params.categoryId as string)
      : undefined;

    const where = categoryId ? { categoryId } : undefined;

    const subcategories = await prisma.subcategory.findMany({ where });
    res.json(subcategories);
  },
};