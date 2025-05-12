export type AbstractButtonType = "text" | "url" | "callback" | "payment";

export interface AbstractButton {
  type: AbstractButtonType;
  label: string;
  payload?: string | (object & { action: string });
  url?: string;
}

export interface AbstractKeyboard {
  inline?: boolean;
  oneTime?: boolean;
  buttons: AbstractButton[][];
}