import { Router } from "express";
import { telegramCallback } from "../../controllers/auth/telegramAuthController";

const router = Router();

router.get('/callback', telegramCallback);

export default router;
