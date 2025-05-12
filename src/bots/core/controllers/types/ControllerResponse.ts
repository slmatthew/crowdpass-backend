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

type ControllerResponseAction = 
  | ActionReply
  | ActionReplyPhoto;

export interface ControllerResponse {
  ok: boolean;
  action: ControllerResponseAction;
}