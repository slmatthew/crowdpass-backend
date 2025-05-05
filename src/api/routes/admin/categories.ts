import { Router } from "express";
import * as controller from "@/api/controllers/admin/categoryController";

const router = Router();

router.get("/categories", controller.getAllCategories);
router.get("/categories/:id", controller.getCategory);
router.get("/categories/:id/subcategories", controller.getSubcategoriesByCategoryId);
router.post("/categories", controller.createCategory);
router.patch("/categories/:id", controller.updateCategory);
router.delete("/categories/:id", controller.deleteCategory);

router.get("/subcategories", controller.getAllSubcategories);
router.get("/subcategories/:id", controller.getSubcategory);
router.post("/subcategories", controller.createSubcategory);
router.patch("/subcategories/:id", controller.updateSubcategory);
router.delete("/subcategories/:id", controller.deleteSubcategory);

export default router;