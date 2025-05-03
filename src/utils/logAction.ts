import { prisma } from '../db/prisma';

interface LogParams {
  actorId: number;
  action: string;
  targetType: string;
  targetId: number;
  metadata?: any;
}

export async function logAction({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
}: LogParams) {
  return prisma.actionLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      metadata,
    },
  });
}