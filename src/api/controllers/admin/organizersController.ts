import { Request, Response } from "express";
import { OrganizerService } from "@/services/organizerService";
import { UserService } from "@/services/userService";

export async function getAllOrganizers(req: Request, res: Response) {
  const organizers = await OrganizerService.getAll();
  res.json(organizers);
}

export async function getOrganizerById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const organizer = await OrganizerService.getById(id);
  if (!organizer) return res.status(404).json({ message: "Не найден" });
  res.json(organizer);
}

export async function getMyOrganizer(req: Request, res: Response) {
  const userId = req.user?.id;
  if(!userId) return res.status(400).json({ message: "Произошла ошибка" });

  const organizer = await OrganizerService.getByManagerId(userId);
  if (!organizer) return res.status(404).json({ message: "Не найден" });
  res.json(organizer);
}

export async function getAvailableOrganizers(req: Request, res: Response) {
  if(req.user?.role === 'MANAGER') {
    const user = await UserService.findUserById(req.user.id);

    const organizerId = user?.admin?.organizerId;
    if(!organizerId) return res.status(400).json({ message: "Вы не прикреплены к организатору, обратитесь к вышестоящим админам" });

    const organizers = await OrganizerService.getAdminAvailableOrganizers(organizerId);
    return res.json(organizers);
  }

  const organizers = await OrganizerService.getAdminAvailableOrganizers();
  res.json(organizers);
}

export async function updateOrganizer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = req.body;
  const updated = await OrganizerService.update(id, data);
  res.json(updated);
}