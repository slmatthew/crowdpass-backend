import { CallbackAction } from "@/bots/core/constants/callbackActions";
import { sendHome } from "../controllers/navigationController";
import { VkRouter } from "../routers/router";

export function handleNavigation(router: VkRouter) {
  router.registerTextCommand('/start', sendHome);
  router.registerTextCommand('начать', sendHome);

  router.registerPayloadCommand(CallbackAction.GO_HOME, sendHome);
}