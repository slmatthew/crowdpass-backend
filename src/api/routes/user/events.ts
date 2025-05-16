import { Router } from "express";
import { authUser } from "@/api/middlewares/authUser";
import * as c from "@api/controllers/user/eventsController";

const router = Router();

router.get('/', authUser, c.compactList);

export default router;