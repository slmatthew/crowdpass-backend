import { Request, Response } from "express";
import axios from "axios";
import { logAction } from "../../../utils/logAction";
import { signToken } from "../../utils/signToken";
import { UserService } from "@/services/userService";

const VK_APP_ID = process.env.AP_VK_APP_ID!;
const VK_APP_SECRET = process.env.AP_VK_SECRET_KEY!;
const JWT_SECRET = process.env.JWT_SECRET!;
const REDIRECT_URL = process.env.AP_VK_REDIRECT_URI!;

function parseJwt(token: string) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return JSON.parse(jsonPayload);
}

export async function vkCallback(req: Request, res: Response) {
  const { code, code_verifier, device_id, state } = req.body;

  if (!code || !code_verifier || !device_id) {
    return res.status(400).json({ message: "Отсутствует код авторизации." });
  }

  try {
    const response = await axios.post("https://id.vk.com/oauth2/auth", {
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URL,
      code,
      code_verifier,
      client_id: VK_APP_ID,
      client_secret: VK_APP_SECRET,
      device_id,
      state,
    });

    const vkData = response.data;

    if (!vkData.id_token) {
      return res.status(400).json({ message: "Не удалось получить id_token" });
    }
    
    const vkUserInfo = parseJwt(vkData.id_token);

    const user = await UserService.findUserByPlatformId('VK', vkUserInfo.sub.toString(), true);

    if (!user || !user.admin) {
      return res.status(403).json({ message: "Доступ запрещён: пользователь не найден или не является администратором." });
    }

    const token = signToken({
      id: user.id,
      role: user.admin.role,
      oid: user.admin.organizerId || undefined
    });

    await logAction({
      actorId: user.id,
      action: "ap.auth.vk",
      targetType: "user",
      targetId: user.id,
    });

    res.json({ token });
  } catch (error: any) {
    console.error("Ошибка обмена VK code:", error.response?.data || error.message);
    res.status(500).json({ message: "Ошибка авторизации через VK." });
  }
}