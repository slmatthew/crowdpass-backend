import { Router } from "express";

import { authUser } from "@/api/middlewares/auth";

import authRoutes from './auth';
import dashboardRoutes from './dashboard';
import bookingsRoutes from './bookings';
import ticketsRoutes from './tickets';
import eventsRoutes from './events';

const router = Router();

router.use('/auth/', authRoutes);
router.use('/dashboard/', authUser, dashboardRoutes);
router.use('/bookings/', authUser, bookingsRoutes);
router.use('/tickets/', authUser, ticketsRoutes);
router.use('/events/', authUser, eventsRoutes);
router.use('/profile/', authUser);

export { router as userRoutes };