import { Keyboard } from 'vk-io';
import { VkStrategy } from '../controllers/VkStrategy';
import { CallbackAction } from '@/bots/core/constants/callbackActions';

export const mainMenuKeyboard = Keyboard.builder()
  .textButton({
    label: '📜 Список мероприятий',
    payload: VkStrategy.callbackAction(CallbackAction.EVENTS_CHOICE_CATEGORY),
    color: 'primary',
  })
  .row()
  .textButton({
    label: '🎟️ Мои бронирования',
    payload: VkStrategy.callbackPayloads.myBookingsPage(1),
    color: 'secondary',
  })
  .textButton({
    label: '🎫 Мои билеты',
    payload: VkStrategy.callbackPayloads.myTicketsPage(1),
    color: 'secondary',
  })
  .oneTime(false);
