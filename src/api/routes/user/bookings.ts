import { Router } from "express";
import * as c from '@api/controllers/user/bookingsController';

const router = Router();

router.get('/', c.myBookings);
router.get('/:id/telegram-invoice', c.getTelegramInvoiceLink);

router.post('/', c.make);

router.delete('/:id', c.cancelBooking);

export default router;