import { prisma } from "../../../db/prisma";
import { Ticket } from "@prisma/client";
import { FormatOptions } from "./formatOptions";

export async function formatTicket(ticket: Ticket & {
  ticketType?: any;
}, options: FormatOptions = {}) {
  const { extended, fields = [] } = options;

  const result: any = {
    id: ticket.id,
    status: ticket.status,
    ownerFirstName: ticket.ownerFirstName,
    ownerLastName: ticket.ownerLastName,
    qrCodeUrl: ticket.qrCodeUrl,
    qrCodeSecret: ticket.qrCodeSecret,
    ticketTypeId: ticket.ticketTypeId,
  };

  if (!extended) return result;

  if (fields.includes("ticketType")) {
    result.ticketType = ticket.ticketType ?? await prisma.ticketType.findUnique({
      where: { id: ticket.ticketTypeId },
      include: {
        event: true,
      },
    });
  }

  return result;
}