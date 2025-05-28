import { Router } from "express";
import * as c from '@api/controllers/user/ticketsController';

const router = Router();

router.get('/my', c.myTickets);

export default router;