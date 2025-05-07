import { Admin, User } from "@prisma/client";

export const privileges = {
  categories: {
    /**
     * Создание, редактирование и soft-delete категорий и подкатегорий
     * @param user 
     * @returns 
     */
    manage: (user: User & { admin?: Admin }): boolean => {
      if(!user.admin) return false;

      return user.admin.role === 'ROOT' || user.admin.role === 'ADMIN';
    },
  },
};