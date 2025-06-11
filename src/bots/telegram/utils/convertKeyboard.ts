import { InlineKeyboard, Keyboard } from "grammy";
import { AbstractKeyboard } from "@/bots/core/ui/abstractTypes";

export function convertKeyboard(abstract: AbstractKeyboard): InlineKeyboard | Keyboard {
  if(abstract.inline) {
    const keyboard = new InlineKeyboard();
    abstract.buttons.forEach(row => {
      const tgButtons = row.map(btn => {
        switch (btn.type) {
          case "callback":
            return InlineKeyboard.text(btn.label, btn.payload as string || "");
          case "url":
            return InlineKeyboard.url(btn.label, btn.url || "");
          default:
            return InlineKeyboard.text(btn.label, btn.payload as string || "");
        }
      });
      keyboard.row(...tgButtons);
    });
    return keyboard;
  } else {
    const keyboard = new Keyboard()
      .resized()
      .oneTime(abstract.oneTime || false);

    abstract.buttons.forEach(row => {
      keyboard.row(...row.map(btn => btn.label));
    });
    return keyboard;
  }
}