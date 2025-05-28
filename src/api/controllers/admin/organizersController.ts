import { Request, Response } from "express";
import { OrganizerService } from "@/services/organizerService";
import { privileges } from "@/api/utils/privileges";

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
  if(!req.user || !req.admin) return res.status(403).json({ message: "Нет доступа" });

  if(req.admin.role === 'MANAGER') {
    if(!req.admin.organizerId) return res.status(400).json({ message: "Вы не прикреплены к организатору, обратитесь к вышестоящим админам" });

    const organizers = await OrganizerService.getAdminAvailableOrganizers(req.admin.organizerId);
    return res.json(organizers);
  }

  const organizers = await OrganizerService.getAdminAvailableOrganizers();
  res.json(organizers);
}

export async function createOrganizer(req: Request, res: Response) {
  if(!req.user || !privileges.organizers.create(req.user)) return res.status(403).json({ message: 'Доступ запрещён' });

  const { name, description, contacts } = req.body;
  if(!name) return res.status(400).json({ message: 'Отсутствует наименование организатора' });

  try {
    const created = await OrganizerService.create({ name, description, contacts });
    res.status(201).json(created);
  } catch(err) {
    res.status(500).json({ message: 'Не удалось создать организатора' });
  }
}

export async function updateOrganizer(req: Request, res: Response) {
  const id = Number(req.params.id);

  if(!req.user || !(await privileges.organizers.updateAndValidate(req.user, id))) return res.status(403).json({ message: 'Доступ запрещён' });
  
  const { name, description, contacts } = req.body;
  if(!name) return res.status(400).json({ message: 'Отсутствует наименование организатора' });

  try {
    const updated = await OrganizerService.update(id, { name, description, contacts });
    res.status(200).json(updated);
  } catch(err) {
    res.status(500).json({ message: 'Не удалось обновить организатора' });
  }
}

export async function deleteOrganizer(req: Request, res: Response) {
  const id = Number(req.params.id);

  if(!req.user || !privileges.organizers.delete(req.user, id)) return res.status(403).json({ message: 'Доступ запрещён' });

  try {
    await OrganizerService.delete(id);
    res.status(204).send();
  } catch(err) {
    console.error('[API] deleteOrganizer', err);
    res.status(500).json({ message: 'Не удалось удалить организатора' });
  }
}