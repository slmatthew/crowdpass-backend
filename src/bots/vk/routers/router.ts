import { MessageContext } from 'vk-io';

type Handler = (ctx: MessageContext) => Promise<any>;
type PatternHandler = (ctx: MessageContext, match: RegExpMatchArray) => Promise<any>;

export class VkRouter {
  private textCommands = new Map<string, Handler>();
  private textPatterns: { pattern: RegExp; handler: PatternHandler }[] = [];

  private payloadCommands = new Map<string, Handler>();
  private payloadPatterns: { pattern: RegExp; handler: PatternHandler }[] = [];

  private fallbackHandler?: Handler;

  // текст
  registerTextCommand(command: string, handler: Handler) {
    this.textCommands.set(command.toLowerCase(), handler);
  }

  registerTextPattern(pattern: RegExp, handler: PatternHandler) {
    this.textPatterns.push({ pattern, handler });
  }

  // payload
  registerPayloadCommand(action: string, handler: Handler) {
    this.payloadCommands.set(action, handler);
  }

  registerPayloadPattern(pattern: RegExp, handler: PatternHandler) {
    this.payloadPatterns.push({ pattern, handler });
  }

  setFallback(handler: Handler) {
    this.fallbackHandler = handler;
  }

  async handle(ctx: MessageContext) {
    const payload = ctx.messagePayload as { action?: string } | undefined;
    const action = payload?.action;

    if(action) {
      const exact = this.payloadCommands.get(action);
      if(exact) return exact(ctx);

      for (const { pattern, handler } of this.payloadPatterns) {
        const match = action.match(pattern);
        if(match) return handler(ctx, match);
      }
    }

    const text = ctx.text?.trim();
    if(text) {
      const exact = this.textCommands.get(text.toLowerCase());
      if(exact) return exact(ctx);

      for (const { pattern, handler } of this.textPatterns) {
        const match = text.match(pattern);
        if(match) return handler(ctx, match);
      }
    }

    if(this.fallbackHandler) return this.fallbackHandler(ctx);
  }
}
