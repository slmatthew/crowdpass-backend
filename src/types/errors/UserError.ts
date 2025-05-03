export const UserErrorCodes = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_INVALID_ID: "USER_INVALID_ID",
  USER_ALREADY_LINKED: "USER_ALREADY_LINKED",

  LINK_CODE_INVALID: "LINK_CODE_INVALID",
} as const;

export class UserError extends Error {
  code: string;
  metadata?: any;

  constructor(code: string, message: string, metadata?: any) {
    super(message);
    this.name = "UserError";
    this.code = code;
    this.metadata = metadata;
  }
}