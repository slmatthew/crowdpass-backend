import { Router } from "express";
import { authUser } from "@/api/middlewares/authUser";
import * as c from '@api/controllers/user/ticketsController';

const router = Router();

router.get('/my', authUser, c.myTickets);

export default router;