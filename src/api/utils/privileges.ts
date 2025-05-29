import { EventService } from "@/services/event.service";
import { TicketTypeService } from "@/services/ticketTypeService";
import { Admin, User } from "@prisma/client";

type UserAdmin = User & { admin?: Admin };

const rolesRootOrAdmin = (user: UserAdmin): boolean => {
  if(!user.admin) return false;

  return user.admin.role === 'ROOT' || user.admin.role === 'ADMIN';
};

/**
 * manage - create, update, delete
 */
export const privileges = {
  organizers: {
    create: rolesRootOrAdmin,
    updateAndValidate: async (user: UserAdmin, organizerId: number) => {
      if(!user.admin) return false;
      if(user.admin.role === 'ROOT' || user.admin.role === 'ADMIN') return true;

      return user.admin.organizerId === organizerId;
    },
    delete: (user: UserAdmin, organizerId: number) => rolesRootOrAdmin(user),
  },
  categories: {
    /**
     * Создание, редактирование и soft-delete категорий и подкатегорий
     * @param user 
     * @returns 
     */
    manage: rolesRootOrAdmin,
  },
  tickets: {
  },
  ticketTypes: {
    manage: async (user: UserAdmin, ticketTypeId?: number, eventId?: number): Promise<Boolean> => {
      return await TicketTypeService.canUserManage(user.id, ticketTypeId, eventId);
    }
  },
  events: {
    create: (user: UserAdmin, organizerId: number): boolean => {
      if(!user.admin) return false;
      if(user.admin.organizerId === null && user.admin.role !== "MANAGER") return true;

      return user.admin.organizerId === organizerId;
    },
    update: async (user: UserAdmin, eventId: number): Promise<boolean> => {
      return await EventService.canUserManage(user.id, eventId);
    },
    delete: rolesRootOrAdmin,
  },
  users: {
    get: rolesRootOrAdmin,
    manage: rolesRootOrAdmin,
    adminManage: (user: UserAdmin): boolean => user.admin?.role === "ROOT",
  },
  logs: {
    get: rolesRootOrAdmin,
  },
};