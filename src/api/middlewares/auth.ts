import { UserService } from "@/services/user.service";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TokenData } from "../utils/signToken";
import { Admin, User } from "@prisma/client";

type PrismaUser = User & {
  admin: Admin | null;
};

async function _auth(
  req: Request,
  res: Response,
  next: NextFunction,
  middleware: (req: Request, res: Response, user: PrismaUser, decoded: TokenData) => any
) {
  const authHeader = req.headers.authorization;

  if(!authHeader) {
    return res.status(401).json({ message: 'Необходим токен авторизации' });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenData;

    const user = await UserService.findById(decoded.id);

    if(!user) {
      return res.status(403).json({ message: 'Пользователь не найден' });
    }

    if(user.isBanned) {
      return res.status(403).json({ message: 'Пользователь заблокирован' });
    }

    await middleware(req, res, user, decoded);

    next();
  } catch(error) {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
}

export async function authUser(req: Request, res: Response, next: NextFunction) {
  return _auth(req, res, next, (req: Request, res: Response, user: PrismaUser) => {
    req.user = user;
  });
}

export async function authAdmin(req: Request, res: Response, next: NextFunction) {
  return _auth(req, res, next, (req: Request, res: Response, user: PrismaUser, decoded: TokenData) => {
    if(!user.admin) {
      if(decoded.adm) return res.status(401).json({ message: 'Необходимо обновить токен' });

      return res.status(403).json({ message: 'Доступ запрещён' });
    }

    if(!["ROOT", "ADMIN", "MANAGER"].includes(user.admin.role)) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }

    req.user = user;
    req.admin = user.admin;
  });
}