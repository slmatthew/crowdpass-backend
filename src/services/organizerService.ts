import { prisma } from "../db/prisma";

export class OrganizerService {
  static async getAll() {
    return prisma.organizer.findMany({
      include: {
        admins: {
          include: { user: true },
        },
        events: {
          where: { endDate: { gte: new Date() } },
          take: 3,
        },
      },
      orderBy: { id: "asc" },
    });
  }

  static async getById(id: number) {
    return prisma.organizer.findUnique({
      where: { id },
      include: {
        admins: { include: { user: true } },
        events: {
          where: { endDate: { gte: new Date() } },
          include: { category: true, subcategory: true },
          take: 3,
        },
      },
    });
  }

  static async getByManagerId(userId: number) {
    const admin = await prisma.admin.findUnique({ where: { userId } });
    if (!admin?.organizerId) return null;

    return this.getById(admin.organizerId);
  }

  static async update(id: number, data: any) {
    return prisma.organizer.update({ where: { id }, data });
  }

  static async getAdminAvailableOrganizers(organizerId: number | null = null, include : object = {}) {
    if(organizerId !== null) {
      return await prisma.organizer.findMany({
        where: {
          id: organizerId,
        },
        include,
      });
    }
  
    return await prisma.organizer.findMany({ include });
  }

  static async getOrganizerAdmins(organizerId: number, includeUser: boolean = false) {
    return await prisma.admin.findMany({
      where: {
        organizerId,
      },
      include: {
        user: includeUser,
      },
    });
  }
}