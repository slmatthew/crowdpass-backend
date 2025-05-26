import { Organizer } from "@prisma/client";
import { prisma } from "../db/prisma";
import { SharedOrganizer, sharedOrganizer } from "@/db/types/organizer";

export class OrganizerService {
  static async getAll(): Promise<SharedOrganizer[]> {
    return prisma.organizer.findMany({
      orderBy: { id: "asc" },
      ...sharedOrganizer,
    });
  }

  static async getById(id: number): Promise<SharedOrganizer | null> {
    return prisma.organizer.findUnique({
      where: { id },
      ...sharedOrganizer,
    });
  }

  static async getByManagerId(userId: number): Promise<SharedOrganizer| null> {
    const admin = await prisma.admin.findUnique({ where: { userId } });
    if (!admin?.organizerId) return null;

    return this.getById(admin.organizerId);
  }

  static async create(data: {
    name: string;
    description?: string;
    contacts?: string;
  }): Promise<Organizer> {
    return prisma.organizer.create({ data });
  }

  static async update(id: number, data: {
    name?: string;
    description?: string;
    contacts?: string;
  }): Promise<Organizer | null> {
    return prisma.organizer.update({
      where: { id },
      data,
    });
  }

  static async delete(id: number) {
    return prisma.organizer.delete({ where: { id } });
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