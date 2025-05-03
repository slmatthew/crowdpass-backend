import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TokenData } from "../utils/signToken";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export function authAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Необходим токен авторизации." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenData;

    if (!["ROOT", "ADMIN", "MANAGER"].includes(decoded.role)) {
      return res.status(403).json({ message: "Недостаточно прав." });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Неверный токен." });
  }
}
