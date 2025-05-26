import { Request, Response } from "express";
import { CategoryService } from "@/services/categoryService";
import { privileges } from "@/api/utils/privileges";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { CategoryError } from "../../../types/errors/CategoryError";

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
  if(!name) return res.status(400).json({ message: 'Неверный формат запроса' });

  try {
    const category = await CategoryService.createCategory(name);
    res.status(201).json(category);
  } catch(err: any) {
    if(err instanceof PrismaClientKnownRequestError) {
      if(err.code === 'P2002') {
        return res.status(400).json({ message: 'Имя уже занято'});
      }
    }

    res.status(500).json({ message: 'Произошла ошибка' });
  }
}

export async function updateCategory(req: Request, res: Response) {
  if(!privileges.categories.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const id = Number(req.params.id);
  const { name } = req.body;
  if(!name) return res.status(400).json({ message: 'Неверный формат запроса' });

  try {
    const updated = await CategoryService.updateCategory(id, name);
    res.json(updated);
  } catch(err: any) {
    if(err instanceof PrismaClientKnownRequestError) {
      if(err.code === 'P2002') {
        return res.status(400).json({ message: 'Имя уже занято'});
      }
    }

    res.status(500).json({ message: 'Произошла ошибка' });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  if(!privileges.categories.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const id = Number(req.params.id);

  try {
    const deleted = await CategoryService.deleteCategory(id);
    res.json(deleted);
  } catch(err: any) {
    if(err instanceof CategoryError) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: 'Произошла ошибка' });
  }
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
  if(!name || !categoryId) return res.status(400).json({ message: 'Неверный формат запроса' });

  try {
    const subcategory = await CategoryService.createSubcategory(name, categoryId);
    res.status(201).json(subcategory);
  } catch(err: any) {
    if(err instanceof PrismaClientKnownRequestError) {
      if(err.code === 'P2002') {
        return res.status(400).json({ message: 'Имя уже занято'});
      }
    }

    res.status(500).json({ message: 'Произошла ошибка' });
  }
}

export async function updateSubcategory(req: Request, res: Response) {
  if(!privileges.categories.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const id = Number(req.params.id);
  const { name, categoryId } = req.body;
  if(!name && !categoryId) return res.status(400).json({ message: 'Неверный формат запроса' });

  try {
    const updated = await CategoryService.updateSubcategory(id, name, categoryId);
    res.json(updated);
  } catch(err: any) {
    if(err instanceof PrismaClientKnownRequestError) {
      if(err.code === 'P2002') {
        return res.status(400).json({ message: 'Имя уже занято'});
      }
    }

    res.status(500).json({ message: 'Произошла ошибка' });
  }
}

export async function deleteSubcategory(req: Request, res: Response) {
  if(!privileges.categories.manage(req.user!)) return res.status(403).json({ message: "Нет доступа" });

  const id = Number(req.params.id);
  
  try {
    const deleted = await CategoryService.deleteSubcategory(id);
    res.json(deleted);
  } catch(err: any) {
    if(err instanceof CategoryError) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: 'Произошла ошибка' });
  }
}