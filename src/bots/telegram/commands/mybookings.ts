import { CommandContext } from "grammy";
import { SharedContext } from "@/types/grammy/SessionData";
import { sendMyBookings } from "../controllers/bookingsController";

export const mybookingsCommand = async (ctx: CommandContext<SharedContext>) => {
  await sendMyBookings(ctx);
};