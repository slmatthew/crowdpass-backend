import { Keyboard as VkKeyboard } from "vk-io";
import { AbstractKeyboard } from "@/bots/core/ui/abstractTypes";

export function convertKeyboard(abstract: AbstractKeyboard): VkKeyboard {
  const keyboard = VkKeyboard.builder()
    .inline(!!abstract.inline)
    .oneTime(!!abstract.oneTime);

  abstract.buttons.forEach(row => {
    row.forEach(btn => {
      switch (btn.type) {
        case "callback":
        case "text":
          keyboard.textButton({
            label: btn.label,
            payload: btn.payload || undefined,
          });
          break;
        case "url":
          keyboard.urlButton({
            label: btn.label,
            url: btn.url || "",
          });
          break;
      }
    });
    keyboard.row();
  });

  return keyboard;
}