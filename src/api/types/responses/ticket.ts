import {
  TicketStatus,
} from "@prisma/client";

export type XTicketShort = {
  id: number;
  qrCodeSecret: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  status: TicketStatus;
  ticketTypeId: number;
  bookingId: number;
  purchaseDate: Date | null;
};