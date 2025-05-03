import { Keyboard } from 'vk-io';

export const getMainMenuKeyboard = () =>
  Keyboard.builder()
    .textButton({
      label: '📜 Список мероприятий',
      payload: { action: 'show_events' },
      color: 'primary',
    })
    .row()
    .textButton({
      label: '🎟️ Мои бронирования',
      payload: { action: 'my_bookings' },
      color: 'secondary',
    })
    .textButton({
      label: '🎫 Мои билеты',
      payload: { action: 'my_tickets' },
      color: 'secondary',
    })
    .oneTime(false);
