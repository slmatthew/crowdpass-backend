import { Request, Response } from 'express';
import { prisma } from '../../../db/prisma';

export async function manage(req: Request, res: Response) {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Недоступно в production" });
  }

  const id = parseInt(req.query.id as string);
  const role = req.query.role as string;

  if (!id || !role) {
    return res.status(400).json({ message: "Нужны параметры id и role" });
  }

  const validRoles = ["ROOT", "ADMIN", "MANAGER"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Недопустимая роль" });
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return res.status(404).json({ message: "Пользователь не найден" });
  }

  const existingAdmin = await prisma.admin.findUnique({ where: { userId: id } });

  if (existingAdmin) {
    await prisma.admin.update({
      where: { userId: id },
      data: { role: role as any },
    });
  } else {
    await prisma.admin.create({
      data: {
        userId: id,
        role: role as any,
      },
    });
  }

  return res.json({ message: `Роль ${role} установлена пользователю ${id} (${user.firstName})` });
}