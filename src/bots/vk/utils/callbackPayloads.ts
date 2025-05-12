import { callbackPayloads as rawPayloads } from "@/bots/core/utils/callbackPayloads";

export const callbackPayloads = new Proxy(rawPayloads, {
  get(target, prop: keyof typeof rawPayloads) {
    const originalFn = target[prop];
    if (typeof originalFn !== "function") {
      return originalFn;
    }

    return (...args: any[]) => {
      const typedFn = originalFn as (...args: unknown[]) => string;
      const result = typedFn(...args);
      return { action: result };
    };
  },
});