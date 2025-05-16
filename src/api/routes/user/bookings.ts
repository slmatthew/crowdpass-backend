import { Router } from "express";
import { authUser } from "@/api/middlewares/authUser";
import * as c from '@api/controllers/user/bookingsController';

const router = Router();

router.get('/', authUser, c.myBookings);
router.get('/:id/telegram-invoice', authUser, c.getTelegramInvoiceLink);

router.post('/', authUser, c.make);

router.delete('/:id', authUser, c.cancelBooking);

export default router;