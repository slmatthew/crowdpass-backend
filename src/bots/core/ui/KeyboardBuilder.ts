import type { AbstractButton, AbstractButtonType, AbstractKeyboard } from "./abstractTypes";

export class KeyboardBuilder {
  private _buttons: AbstractButton[][] = [[]];
  private _inline = true;
  private _oneTime = false;

  inline(value: boolean = true): this {
    this._inline = value;
    return this;
  }

  oneTime(value: boolean = true): this {
    this._oneTime = value;
    return this;
  }

  textButton(label: string, payload?: string): this {
    this._addButton("text", label, payload);
    return this;
  }

  callbackButton(label: string, payload: AbstractButton['payload']): this {
    this._addButton("callback", label, payload);
    return this;
  }

  urlButton(label: string, url: string): this {
    this._addButton("url", label, undefined, url);
    return this;
  }

  row(): this {
    this._buttons.push([]);
    return this;
  }

  build(): AbstractKeyboard {
    return {
      inline: this._inline,
      oneTime: this._oneTime,
      buttons: this._buttons.filter(row => row.length > 0),
    };
  }

  private _addButton(type: AbstractButtonType, label: string, payload?: AbstractButton['payload'], url?: string): void {
    const button: AbstractButton = { type, label, payload, url };
    this._buttons[this._buttons.length - 1].push(button);
  }
}
