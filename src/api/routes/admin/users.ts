import { Router } from "express";
import { getUsers, getUserById, promoteToAdmin, demoteAdmin, changePlatformId, updateInfo, resetPlatformId, banUnban } from "@api/controllers/admin/usersController";

const router = Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateInfo);
router.post("/:id/reset-platform", resetPlatformId);
router.post("/:id/edit-platform", changePlatformId);
router.post("/:id/make-admin", promoteToAdmin);
router.post("/:id/ban", banUnban);
router.delete("/:id/remove-admin", demoteAdmin);

export default router;