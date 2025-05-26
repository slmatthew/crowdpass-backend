import { Category, Subcategory } from "@prisma/client";

export type XCategory = {
  id: number;
  name: string;
  subcategories?: XSubcategory[];
};

export type XSubcategory = {
  id: number;
  name: string;
  categoryId: number;
  category?: XCategory;
};

export const formatCategory = {
  safe: (category: Category & { subcategories?: Subcategory[] }): XCategory => ({
    id: category.id,
    name: category.name,
    subcategories: category.subcategories,
  }),
};

export const formatSubcategory = {
  safe: (subcategory: Subcategory & { category?: Category }): XSubcategory => ({
    id: subcategory.id,
    name: subcategory.name,
    categoryId: subcategory.categoryId,
    category: subcategory.category,
  }),
};