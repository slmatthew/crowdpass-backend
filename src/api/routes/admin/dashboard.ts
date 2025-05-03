import { Router } from "express";
import { getCategories, getMe, getOrganizers, getSubcategories, getSummary } from "../../controllers/admin/dashboardController";

const router = Router();

router.get('/summary', getSummary);
router.get('/me', getMe);

/**
 * @TODO вынести это все в отдельные специализированные роуты
 * 
 * пока что так, но в будущем, когда начнется реализация управления категориями,
 * организаторами и т.д. - нужно будет сделать отдельные роуты,
 * а фронт должен будет получать данные из этих роутов:
 * /admin/dashboard/metadata/organizers -> /admin/organizers
 */
router.get('/metadata/organizers', getOrganizers);
router.get('/metadata/categories', getCategories);
router.get('/metadata/categories/:categoryId/subcategories', getSubcategories);

export default router;