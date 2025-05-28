import { UserService } from "@/services/user.service";

let rootSetupCode: string | null = null;
let rootSetupActive = false;

export async function prepareRootSetup() {
  const rootExists = await UserService.rootExists();
  if(!rootExists) {
    rootSetupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    rootSetupActive = true;
    console.log(`🚨 ROOT не назначен. Отправьте этот код боту: ${rootSetupCode}`);
    return rootSetupCode;
  }
  return null;
}

export function isRootSetupActive() {
  return rootSetupActive;
}

export function attemptClaimRoot(code: string): boolean {
  if(rootSetupActive && code === rootSetupCode) {
    rootSetupCode = null;
    rootSetupActive = false;
    return true;
  }
  return false;
}