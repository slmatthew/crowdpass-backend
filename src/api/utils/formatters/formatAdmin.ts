import { prisma } from "../../../db/prisma";
import { Admin } from "@prisma/client";
import { FormatOptions } from "./formatOptions";

export async function formatAdmin(admin: Admin & {
  user?: any;
  organizer?: any;
}, options: FormatOptions = {}) {
  const { extended, fields = [] } = options;

  const result: any = {
    id: admin.id,
    userId: admin.userId,
    role: admin.role,
    organizerId: admin.organizerId,
    createdAt: admin.createdAt,
  };

  if (!extended) return result;

  if (fields.includes("user")) {
    result.user = admin.user ?? await prisma.user.findUnique({
      where: { id: admin.userId },
    });
  }

  if (fields.includes("organizer") && admin.organizerId) {
    result.organizer = admin.organizer ?? await prisma.organizer.findUnique({
      where: { id: admin.organizerId },
    });
  }

  return result;
}