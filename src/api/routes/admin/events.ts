import { Router } from "express";
import {
	getAllEvents,
	getPopularEvents,
	getEventById,
	updateEventById,
	createEvent,
} from "../../controllers/admin/eventController";

const router = Router();

router.get("/", getAllEvents);
router.get("/popular", getPopularEvents);
router.get("/:id", getEventById);

router.patch('/:id', updateEventById);

router.post('/', createEvent);

export default router;