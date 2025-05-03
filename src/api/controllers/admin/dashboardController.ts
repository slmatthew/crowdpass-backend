import { Request, Response } from "express";
import { prisma } from "../../../db/prisma";
import { UserService } from "../../../services/userService";
import { getSummary as getSummaryDb } from "../../../services/adminDashboardService";
import { getAdminAvailableOrganizers } from "../../../services/organizerService";

export async function getSummary(req: Request, res: Response) {
  const { ticketCount, soldTicketCount, eventCount, userCount, bookingCount } = await getSummaryDb();

  res.json({
    totalTickets: ticketCount,
    soldTickets: soldTicketCount,
    totalEvents: eventCount,
    totalUsers: userCount,
    totalBookings: bookingCount,
  });
}

export async function getMe(req: Request, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Не найден id пользователя' });
  }

  const user = await UserService.findUserById(userId);

  if (!user || !user.admin) {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }

  res.json(user);
}

/* временное решение */
export const getOrganizers = async (req: Request, res: Response) => {
  if(req.user?.role === 'MANAGER') {
    const user = await UserService.findUserById(req.user.id);

    const organizerId = user?.admin?.organizerId;
    if(organizerId) {
      const organizers = await getAdminAvailableOrganizers(organizerId);
      return res.json(organizers);
    }
  }

  const organizers = await getAdminAvailableOrganizers();
  res.json(organizers);
};

export const getCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
};

export const getSubcategories = async (req: Request, res: Response) => {
  const categoryId = req.params.categoryId
    ? parseInt(req.params.categoryId as string)
    : undefined;

  const where = categoryId ? { categoryId } : undefined;

  const subcategories = await prisma.subcategory.findMany({ where });
  res.json(subcategories);
};