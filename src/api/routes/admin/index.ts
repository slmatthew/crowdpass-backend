import { Router } from "express";
import { authAdmin } from "@/api/middlewares/authAdmin";

import eventsRoutes from '@api/routes/admin/events';
import dashboardRoutes from '@api/routes/admin/dashboard';
import logsRoutes from '@api/routes/admin/logs';
import bookingsRoutes from '@api/routes/admin/bookings';
import categoriesRoutes from '@api/routes/admin/categories';
import usersRoutes from '@api/routes/admin/users';
import organizersRoutes from '@api/routes/admin/organizers';
import ticketTypesRoutes from '@api/routes/admin/ticketTypes';

const router = Router();

router.use('/admin/', authAdmin, categoriesRoutes);
router.use('/admin/organizers', authAdmin, organizersRoutes);
router.use('/admin/dashboard', authAdmin, dashboardRoutes);
router.use('/admin/events', authAdmin, eventsRoutes);
router.use('/admin/ticket-types', authAdmin, ticketTypesRoutes);
router.use('/admin/bookings', authAdmin, bookingsRoutes);
router.use('/admin/users', authAdmin, usersRoutes);
router.use('/admin/logs', authAdmin, logsRoutes);

export { router as adminRoutes };