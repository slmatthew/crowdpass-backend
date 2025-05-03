import { Request, Response } from 'express';
import { prisma } from '../../../db/prisma';
import { AdminDashboardService, LogFilters } from '@/services/adminDashboardService';

export async function getLogs(req: Request, res: Response) {
  const {
    actorId,
    action,
    targetType,
    from,
    to,
    page = 1,
    pageSize = 20,
  } = req.query;

  const filters: LogFilters = {};

  if (actorId) filters.actorId = Number(actorId);
  if (action) filters.action = String(action);
  if (targetType) filters.targetType = String(targetType);

  if (from || to) {
    filters.createdAt = {};
    if (from) filters.createdAt.gte = new Date(from as string);
    if (to) filters.createdAt.lte = new Date(to as string);
  }

  const take = Number(pageSize);
  const skip = (Number(page) - 1) * take;

  const { logs, total } = await AdminDashboardService.getLogs(filters, skip, take);
  res.json({ logs, total });
}