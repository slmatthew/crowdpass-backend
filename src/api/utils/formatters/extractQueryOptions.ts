import { Request } from "express";
import { FormatOptions } from "./formatOptions";

export function extractQueryOptions(req: Request): FormatOptions {
  const extendedRaw = req.query?.extended ?? req.body?.extended;
  const fieldsRaw = req.query?.fields ?? req.body?.fields;

  const extended : FormatOptions['extended'] = extendedRaw === "1" || extendedRaw === true;
  const fields   : FormatOptions['fields']   = typeof fieldsRaw === "string"
    ? fieldsRaw.split(",").map((f) => f.trim()).filter(Boolean)
    : Array.isArray(fieldsRaw)
    ? fieldsRaw
    : undefined;

  return { extended, fields };
}