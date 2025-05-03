import { MessageContext } from 'vk-io';

type Handler = (ctx: MessageContext) => Promise<any>;

export class VkRouter {
  private textCommands = new Map<string, Handler>();
  private payloadCommands = new Map<string, Handler>();
  private fallbackHandler?: Handler;

  registerTextCommand(command: string, handler: Handler) {
    this.textCommands.set(command.toLowerCase(), handler);
  }

  registerPayloadCommand(action: string, handler: Handler) {
    this.payloadCommands.set(action, handler);
  }

  setFallback(handler: Handler) {
    this.fallbackHandler = handler;
  }

  async handle(ctx: MessageContext) {
    const payload = ctx.messagePayload as { action?: string; code?: string } | undefined;

    if (payload?.action) {
      const handler = this.payloadCommands.get(payload.action);
      if (handler) return handler(ctx);
    }

    const text = ctx.text?.trim().toLowerCase();
    if (text) {
      const handler = this.textCommands.get(text);
      if (handler) return handler(ctx);
    }

    if (this.fallbackHandler) return this.fallbackHandler(ctx);
  }
}