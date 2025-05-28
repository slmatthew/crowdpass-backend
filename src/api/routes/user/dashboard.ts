import { Router } from "express";
import * as c from "@api/controllers/user/dashboardController";

const router = Router();

router.get('/', c.dashboard);
router.get('/me', c.me);
router.get('/features', c.getFeatures);

export default router;