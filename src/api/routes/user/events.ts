import { Router } from "express";
import * as c from "@api/controllers/user/eventsController";

const router = Router();

router.get('/', c.compactList);
router.get('/:id', c.details);

export default router;