import { Router } from "express";
import { refresh, logout, TelegramAuth } from "@/api/controllers/auth/authController";

const router = Router();

router.post('/tma', TelegramAuth.miniApp);

router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;