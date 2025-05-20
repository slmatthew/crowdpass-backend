import { Router } from "express";
import { authUser } from "@/api/middlewares/authUser";
import * as c from "@api/controllers/user/dashboardController";

const router = Router();

router.get('/', authUser, c.dashboard);
router.get('/me', authUser, c.me);
router.get('/features', authUser, c.getFeatures);

export default router;