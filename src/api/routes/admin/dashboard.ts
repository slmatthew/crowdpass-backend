import { Router } from "express";
import { dashboardController } from "../../controllers/admin/dashboardController";

const router = Router();

router.get('/summary', dashboardController.getSummary);
router.get('/me', dashboardController.getMe);

export default router;