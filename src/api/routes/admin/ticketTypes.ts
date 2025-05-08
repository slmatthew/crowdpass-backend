import { Router } from "express";
import {
  getTicketTypesByEvent,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  issueTickets
} from "@/api/controllers/admin/ticketTypesController";

const router = Router();

router.get("/event/:eventId", getTicketTypesByEvent);
router.post("/", createTicketType);
router.patch("/:id", updateTicketType);
router.delete("/:id", deleteTicketType);
router.post("/:id/issue", issueTickets);

export default router;