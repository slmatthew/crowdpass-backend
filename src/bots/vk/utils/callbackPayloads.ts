import { CallbackPayloadsObject } from "@/bots/core/controllers/types/CallbackPayloadsTypes";
import { callbackPayloads as rawPayloads } from "@/bots/core/utils/callbackPayloads";

export const callbackPayloads: CallbackPayloadsObject = new Proxy({} as CallbackPayloadsObject, {
  get(_, prop: keyof typeof rawPayloads) {
    const originalFn = rawPayloads[prop];
    if(typeof originalFn !== "function") {
      return originalFn;
    }

    return (...args: any[]) => {
      const typedFn = originalFn as (...args: unknown[]) => string;
      const result = typedFn(...args);
      return { action: result };
    };
  },
});