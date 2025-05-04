export type BookingSession = {
  eventId: number;
  fromPage: number;
  ticketTypeId?: number;
  ticketsCount?: number;
  step?: 'awaiting_tickets_count' | null;
};

export const bookingSessions: Record<string, BookingSession> = {};
export const bookingTimeouts: Record<string, NodeJS.Timeout> = {};