export enum CallbackAction {
  /* главное меню */
  SHOW_EVENTS = "show_events",
  MY_BOOKINGS = "my_bookings",
  MY_TICKETS = "my_tickets",

  /* глобальная навигация */
  GO_HOME = "go_home",

  /* мероприятия */
  EVENTS_PAGE = "ev_page",
  EVENT_DETAILS = "ev_details",
  EVENT_NAVIGATE = "ev_navigate",

  /* бронирования */
  MY_BOOKINGS_PAGE = "mbk_page", // страница бронирований
  MY_BOOKING_CANCEL = "mbk_cancel", // страница бронирования
  BOOKING_START = "bk_start",
  BOOKING_SELECT_TYPE = "bk_type",
  BOOKING_CONFIRM = "bk_confirm",
  BOOKING_CANCEL = "bk_cancel",

  /* билеты */
  TICKET_QR = "tk_qr", // мои билеты
}