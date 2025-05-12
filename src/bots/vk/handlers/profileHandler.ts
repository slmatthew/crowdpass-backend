import { CallbackAction } from "@/bots/core/constants/callbackActions";
import { sendLink, sendLinkConfirm } from "../controllers/profileController";
import { VkRouter } from "../routers/router";

export function handleProfile(router: VkRouter) {
  router.registerTextCommand('/link', sendLink);
  router.registerPayloadCommand(CallbackAction.LINK_TELEGRAM, sendLink);
  router.registerPayloadCommand(CallbackAction.LINK_CONFIRM, sendLinkConfirm);
}