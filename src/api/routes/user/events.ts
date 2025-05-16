import { Router } from "express";
import { authUser } from "@/api/middlewares/authUser";
import * as c from "@api/controllers/user/eventsController";

const router = Router();

router.get('/', authUser, c.compactList);
router.get('/:id', authUser, c.details);

export default router;