import { prisma } from "@/db/prisma";

export class SessionService {
  static async findByRefreshToken(refreshToken: string) {
    return prisma.session.findUnique({ where: { refreshToken } });
  }

  static async findByUserId(userId: number) {
    return prisma.session.findMany({ where: { userId } });
  }

  static async create(userId: number, refreshToken: string, expiresAt: Date) {
    return prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      }
    });
  }

  static async delete(sessionId: number) {
    return prisma.session.deleteMany({ where: { id: sessionId } });
  }

  static async deleteByUserId(userId: number) {
    return prisma.session.deleteMany({ where: { userId } });
  }
}