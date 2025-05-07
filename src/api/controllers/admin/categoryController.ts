import { Request, Response } from "express";
import { CategoryService } from "@/services/categoryService";
import { privileges } from "@/api/utils/privileges";

// === CATEGORY ===

export async function getAllCategories(req: Request, res: Response) {
  const includeSubcategories = req.query.subcategories === "true" || req.query.subcategories === "1";
  const categories = await CategoryService.getAllCategories(includeSubcategories);
  res.json(categories);
}

export async function getCategory(req: Request, res: Response) {
  const id = Number(req.params.id);
  const category = await CategoryService.getCategoryById(id, true);
  if (!category) return res.status(404).json({ error: "Категория не найдена" });
  res.json(category);
}

export async function createCategory(req: Request, res: Response) {
  if(!privileges.categories.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const { name } = req.body;
  const category = await CategoryService.createCategory(name);
  res.status(201).json(category);
}

export async function updateCategory(req: Request, res: Response) {
  if(!privileges.categories.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const id = Number(req.params.id);
  const { name } = req.body;
  const updated = await CategoryService.updateCategory(id, name);
  res.json(updated);
}

export async function deleteCategory(req: Request, res: Response) {
  if(!privileges.categories.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const id = Number(req.params.id);
  const deleted = await CategoryService.deleteCategory(id);
  res.json(deleted);
}

// === SUBCATEGORY ===

export async function getAllSubcategories(req: Request, res: Response) {
  const subcategories = await CategoryService.getAllSubcategories(false);
  res.json(subcategories);
}

export async function getSubcategory(req: Request, res: Response) {
  const id = Number(req.params.id);
  const subcategory = await CategoryService.getSubcategoryById(id, true);
  if (!subcategory) return res.status(404).json({ error: "Подкатегория не найдена" });
  res.json(subcategory);
}

export async function getSubcategoriesByCategoryId(req: Request, res: Response) {
  const id = Number(req.params.id);
  const subcategories = await CategoryService.getSubcategoriesByCategoryId(id);
  res.json(subcategories);
}

export async function getLostSubcategories(req: Request, res: Response) {
  const subcategories = await CategoryService.getLostSubcategories();
  res.json(subcategories);
}

export async function createSubcategory(req: Request, res: Response) {
  if(!privileges.categories.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const { name, categoryId } = req.body;
  const subcategory = await CategoryService.createSubcategory(name, categoryId);
  res.status(201).json(subcategory);
}

export async function updateSubcategory(req: Request, res: Response) {
  if(!privileges.categories.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const id = Number(req.params.id);
  const { name, categoryId } = req.body;
  const updated = await CategoryService.updateSubcategory(id, name, categoryId);
  res.json(updated);
}

export async function deleteSubcategory(req: Request, res: Response) {
  if(!privileges.categories.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const id = Number(req.params.id);
  const deleted = await CategoryService.deleteSubcategory(id);
  res.json(deleted);
}