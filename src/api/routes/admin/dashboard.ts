import { Router } from "express";
import { dashboardController } from "../../controllers/admin/dashboardController";

const router = Router();

router.get('/summary', dashboardController.getSummary);
router.get('/me', dashboardController.getMe);

/**
 * @TODO вынести это все в отдельные специализированные роуты
 * 
 * пока что так, но в будущем, когда начнется реализация управления категориями,
 * организаторами и т.д. - нужно будет сделать отдельные роуты,
 * а фронт должен будет получать данные из этих роутов:
 * /admin/dashboard/metadata/organizers -> /admin/organizers
 */
router.get('/metadata/organizers', dashboardController.getOrganizers);
router.get('/metadata/categories', dashboardController.getCategories);
router.get('/metadata/categories/:categoryId/subcategories', dashboardController.getSubcategories);

export default router;