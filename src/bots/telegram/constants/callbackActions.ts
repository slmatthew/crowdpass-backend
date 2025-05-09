export enum CallbackAction {
  /* глобальная навигация */
  GO_HOME = "go_home",

  /* мероприятия */
  EVENTS_ALL = "ev_all",
  EVENTS_CHOICE_CATEGORY = "ev_choice_ctg",
  EVENTS_PAGE = "ev_page",
  EVENTS_CATEGORIED_PAGE = "ev_p_ctg",
  EVENTS_SUBCATEGORIED_PAGE = "ev_p_subctg",
  EVENT_DETAILS = "ev_details",
  EVENT_DETAILS_CATEGORY = "ev_d_ctg",
  EVENT_DETAILS_SUBCATEGORY = "ev_d_subctg",
  EVENT_CATEGORY = "ev_ctg",
  EVENT_GET_CATEGORY = "ev_get_ctg",
  EVENT_GET_SUBCATEGORY = "ev_get_subctg",

  /* бронирования */
  MY_BOOKINGS_PAGE = "mbk_page", // страница бронирований
  MY_BOOKING_PAY = "mbk_pay",
  MY_BOOKING_CANCEL = "mbk_cancel", // страница бронирования
  BOOKING_START = "bk_start",
  BOOKING_SELECT_TYPE = "bk_type",
  BOOKING_CONFIRM = "bk_confirm",
  BOOKING_CANCEL = "bk_cancel",

  /* билеты */
  TICKET_QR = "tk_qr", // мои билеты

  /* главное меню */
  SHOW_EVENTS = CallbackAction.EVENTS_ALL,
  MY_BOOKINGS = "my_bookings",
  MY_TICKETS = "my_tickets",
}