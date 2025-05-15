import { Router } from "express";
import { authUser } from "@/api/middlewares/authUser";

import authRoutes from './auth';
import dashboardRoutes from './dashboard';
import bookingsRoutes from './bookings';
import ticketsRoutes from './tickets';

const router = Router();

router.use('/auth/', authRoutes);
router.use('/dashboard/', authUser, dashboardRoutes);
router.use('/bookings/', authUser, bookingsRoutes);
router.use('/tickets/', authUser, ticketsRoutes);
router.use('/events/', authUser);
router.use('/profile/', authUser);

export { router as userRoutes };