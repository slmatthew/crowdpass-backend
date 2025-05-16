import { Router } from "express";
import { TelegramAuth } from "@/api/controllers/auth/telegramAuthController";

const router = Router();

router.get('/callback', TelegramAuth.callback);

export default router;
