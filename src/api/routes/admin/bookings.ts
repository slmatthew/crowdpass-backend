import { Router } from "express";
import {
  getBookings,
  getBookingById,
  updateBookingStatus,
  updateTicketStatus,
} from "../../controllers/admin/bookingsController";

const router = Router();

router.get("/", getBookings);
router.get("/:id", getBookingById);

router.patch("/:id/status", updateBookingStatus);
router.patch("/:bookingId/tickets/:ticketId/status", updateTicketStatus);

export default router;