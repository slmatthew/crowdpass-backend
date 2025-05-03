import { User } from "@prisma/client";
import { Context } from 'grammy';

export interface SfxContext extends Context {
  sfx: {
    user?: User
  }
}
