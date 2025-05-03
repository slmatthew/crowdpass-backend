import { Router } from "express";
import { manage } from "../../controllers/internal/mainController";

const router = Router();

router.get('/manage', manage);

export default router;