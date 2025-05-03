import { Router } from "express";
import { vkCallback } from "../../controllers/auth/vkAuthController";

const router = Router();

router.post('/callback', vkCallback);

export default router;
