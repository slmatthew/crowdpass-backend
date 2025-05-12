interface BookingSessionData {
  step: 'start' | 'ask_count' | 'end';
  eventId: number;
  ticketTypeId?: number;
  ticketsCount?: number;
  fromPage: number;
}

class BookingSessionService {
  private sessions = new Map<number, BookingSessionData>();
  private timeouts = new Map<number, NodeJS.Timeout>();

  setSession(userId: number, data: BookingSessionData) {
    this.sessions.set(userId, data);
  }

  getSession(userId: number) {
    return this.sessions.get(userId);
  }

  deleteSession(userId: number) {
    this.sessions.delete(userId);
    const timeout = this.timeouts.get(userId);
    if (timeout) clearTimeout(timeout);
    this.timeouts.delete(userId);
  }

  setTimeout(userId: number, timeout: NodeJS.Timeout) {
    this.timeouts.set(userId, timeout);
  }

  getTimeout(userId: number) {
    return this.timeouts.get(userId);
  }

  deleteTimeout(userId: number) {
    const timeout = this.timeouts.get(userId);
    if (timeout) clearTimeout(timeout);
    this.timeouts.delete(userId);
  }
}

export const bookingSessionService = new BookingSessionService();