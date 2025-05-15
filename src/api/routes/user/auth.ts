import { Router } from "express";
import * as c from '@api/controllers/user/authController';

const router = Router();

router.post('/tma', c.tma);

export default router;