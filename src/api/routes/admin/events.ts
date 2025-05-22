import { Router } from "express";
import {
	getAllEvents,
	getPopularEvents,
	getEventById,
	updateEventById,
	createEvent,
	getEventOverview,
	getEventSalesByDay,
} from "../../controllers/admin/eventController";

const router = Router();

router.get("/", getAllEvents);
router.get("/popular", getPopularEvents);
router.get("/:id", getEventById);
router.get("/:id/overview", getEventOverview);
router.get("/:id/sales", getEventSalesByDay);

router.patch('/:id', updateEventById);

router.post('/', createEvent);

export default router;