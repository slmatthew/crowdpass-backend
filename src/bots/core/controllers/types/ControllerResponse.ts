import { AbstractKeyboard } from "../../ui/abstractTypes";

interface TextContent {
  plain: string;
  markdown?: string;
}

export interface ActionReply {
  text: TextContent;
  isNotify?: boolean;
  keyboard?: AbstractKeyboard;
}

export interface ActionReplyPhoto {
  photo: any;
  text?: TextContent;
  keyboard?: AbstractKeyboard;
}

export interface ControllerResponse {
  ok: boolean;
  action: ActionReply | ActionReplyPhoto;
}