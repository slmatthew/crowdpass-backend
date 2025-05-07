import { prisma } from "@/db/prisma";
import { CategoryError, CategoryErrorCodes } from "@/types/errors/CategoryError";

export class CategoryService {
  static isNotDeletedOption = { where: { isDeleted: false } };

  // === GET ===

  static async getAllCategories(subcategories: boolean = false, take?: number, skip?: number, order: 'asc' | 'desc' = 'asc') {
    return prisma.category.findMany({
      where: { isDeleted: false },
      include: { subcategories: subcategories ? this.isNotDeletedOption : false },
      orderBy: { id: order },
      take,
      skip,
    });
  }

  static async getCategoryById(id: number, subcategories: boolean = false) {
    return prisma.category.findFirst({
      where: { id, isDeleted: false },
      include: { subcategories: subcategories ? this.isNotDeletedOption : false },
    });
  }

  static async getAllSubcategories(category: boolean = true, take?: number, skip?: number, order: 'asc' | 'desc' = 'asc') {
    return prisma.subcategory.findMany({
      where: {
        isDeleted: false,
        category: { isDeleted: false },
      },
      include: { category },
      orderBy: { id: order },
      take,
      skip,
    });
  }

  static async getSubcategoryById(id: number, category: boolean = true) {
    return prisma.subcategory.findFirst({
      where: { id, isDeleted: false, category: { isDeleted: false } },
      include: { category },
    });
  }

  static async getSubcategoriesByCategoryId(categoryId: number, take?: number, skip?: number, order: 'asc' | 'desc' = 'asc') {
    return prisma.subcategory.findMany({
      where: { categoryId, isDeleted: false },
      take,
      skip,
      orderBy: { id: order },
    });
  }

  static async getLostSubcategories(take?: number, skip?: number, order: 'asc' | 'desc' = 'asc') {
    return prisma.subcategory.findMany({
      where: {
        isDeleted: false,
        category: {
          isDeleted: true,
        },
      },
      include: {
        category: true,
      },
    });
  }

  // === CREATE ===

  static async createCategory(name: string) {
    return prisma.category.create({ data: { name } });
  }

  static async createSubcategory(name: string, categoryId: number) {
    return prisma.subcategory.create({ data: { name, categoryId } });
  }

  // === UPDATE ===

  static async updateCategory(id: number, name: string) {
    return prisma.category.update({
      where: { id },
      data: { name },
    });
  }

  static async updateSubcategory(id: number, name: string, categoryId?: number) {
    return prisma.subcategory.update({
      where: { id },
      data: {
        name,
        ...(categoryId !== undefined && { categoryId }),
      },
    });
  }

  // === SOFT DELETE ===

  static async deleteCategory(id: number) {
    const category = await prisma.category.findUnique({ where: { id } });

    if(!category) throw new CategoryError(CategoryErrorCodes.CATEGORY_NOT_FOUND, "Указанной категории не существует");
    if(category.isDeleted) throw new CategoryError(CategoryErrorCodes.CATEGORY_SOFT_DELETED, "Категория уже удалена");

    return prisma.category.update({
      where: { id },
      data: {
        name: `${category.name} ${id}`,
        isDeleted: true
      },
    });
  }

  static async deleteSubcategory(id: number) {
    const subcategory = await prisma.subcategory.findUnique({ where: { id } });

    if(!subcategory) throw new CategoryError(CategoryErrorCodes.CATEGORY_NOT_FOUND, "Указанной подкатегории не существует");
    if(subcategory.isDeleted) throw new CategoryError(CategoryErrorCodes.CATEGORY_SOFT_DELETED, "Подкатегория уже удалена");

    return prisma.subcategory.update({
      where: { id },
      data: {
        name: `${subcategory.name} ${id}`,
        isDeleted: true
      },
    });
  }

  // === RESTORE ===

  static async restoreCategory(id: number) {
    return prisma.category.update({
      where: { id },
      data: { isDeleted: false },
    });
  }

  static async restoreSubcategory(id: number) {
    return prisma.subcategory.update({
      where: { id },
      data: { isDeleted: false },
    });
  }
}