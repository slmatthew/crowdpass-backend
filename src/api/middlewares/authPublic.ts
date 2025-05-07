import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TokenData } from "../utils/signToken";
import { UserService } from "@/services/userService";

export async function authPublic(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Необходим токен авторизации." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenData;

    const user = await UserService.findUserById(decoded.id);

    if (!user || (!!user && !user.admin)) {
      return res.status(403).json({ message: "Недостаточно прав." });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Неверный токен." });
  }
}
