import { Router } from "express";
import { dashboardController } from "../../controllers/admin/dashboardController";

const router = Router();

router.get('/summary', dashboardController.getSummary);
router.get('/me', dashboardController.getMe);
router.get('/registers', dashboardController.getRegistersByDay);

router.post('/validate-ticket', dashboardController.validateTicket);

export default router;