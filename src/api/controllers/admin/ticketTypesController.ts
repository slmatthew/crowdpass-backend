import { Request, Response } from "express";
import { TicketTypeService } from "@/services/ticketTypeService";
import { privileges } from "@/api/utils/privileges";
import { TicketTypeError, TicketTypeErrorCodes } from "@/types/errors/TicketTypeError";
import { EventError } from "@/types/errors/EventError";

export async function getTicketTypesByEvent(req: Request, res: Response) {
  const eventId = Number(req.params.eventId);
  const types = await TicketTypeService.getByEvent(eventId);
  res.json(types);
}

export async function createTicketType(req: Request, res: Response) {
  const { eventId, name, price, quantity } = req.body;
  if(!(await privileges.ticketTypes.manage(req.user!, undefined, eventId))) return res.status(403).json({ message: "Нет доступа" });

  try {
    const type = await TicketTypeService.create({ eventId, name, price, quantity });
    res.status(201).json(type);
  } catch(err) {
    if(err instanceof TicketTypeError || err instanceof EventError) {
      return res.status(400).json({ message: err.message });
    }

    console.error(err);
    res.status(400).json({ message: 'Произошла ошибка' });
  }
}

export async function updateTicketType(req: Request, res: Response) {
  const id = Number(req.params.id);
  if(!(await privileges.ticketTypes.manage(req.user!, id))) return res.status(403).json({ message: "Нет доступа" });

  try {
    const type = await TicketTypeService.update(id, req.body);
    res.json(type);
  } catch(err) {
    if(err instanceof TicketTypeError) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: 'Произошла ошибка' });
  }
}

export async function deleteTicketType(req: Request, res: Response) {
  const id = Number(req.params.id);
  if(!(await privileges.ticketTypes.manage(req.user!, id))) return res.status(403).json({ message: "Нет доступа" });

  const confirm = req.query.confirm === 'true' || req.query.confirm === '1';

  const role = req.admin?.role;
  if(!role) return res.status(403).json({ message: "Нет доступа" });

  try {
    await TicketTypeService.remove(id, role, confirm);
    res.status(204).send();
  } catch (error: any) {
    if(error instanceof TicketTypeError) {
      if(error.code === TicketTypeErrorCodes.ACCESS_DENIED) return res.status(403).json({ message: "Нет доступа" });
      if(error.code === TicketTypeErrorCodes.NEED_CONFIRM) return res.status(409).json({ message: error.message });

      return res.status(400).json({ message: error.message });
    }

    console.error('controller/deleteTicketType', error);
    res.status(409).json({ message: "Произошла ошибка" });
  }
}

export async function issueTickets(req: Request, res: Response) {
  const id = Number(req.params.id);
  if(!(await privileges.ticketTypes.manage(req.user!, id))) return res.status(403).json({ message: "Нет доступа" });

  const { count } = req.body;
  
  try {
    const tickets = await TicketTypeService.issue(id, count ?? 0);

    if(tickets.count === 0) return res.status(200).json(tickets);
    res.status(201).json(tickets);
  } catch(err: any) {
    if(err instanceof TicketTypeError) {
      return res.status(400).json({ message: err.message });
    }

    console.error(err);
    res.status(400).json({ message: 'Произошла ошибка' });
  }
}