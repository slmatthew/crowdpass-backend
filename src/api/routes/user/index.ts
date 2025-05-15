import { Router } from "express";
import { authUser } from "@/api/middlewares/authUser";

import authRoutes from './auth';
import dashboardRoutes from './dashboard';
import bookingsRoutes from './bookings';

const router = Router();

router.use('/auth/', authRoutes);
router.use('/dashboard/', authUser, dashboardRoutes);
router.use('/bookings/', authUser, bookingsRoutes);

export { router as userRoutes };