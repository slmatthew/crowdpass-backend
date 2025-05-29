export const CommonErrorCodes = {
  INVALID_PARAMS: "C001",

  USER_NOT_FOUND: "U001",
  USER_INVALID_ID: "U002",
  USER_BANNED: "U003",

  EVENT_NOT_FOUND: "E001",
} as const;

export class CommonError extends Error {
  code: string;
  metadata?: any;

  constructor(code: string, message: string, metadata?: any) {
    super(message);
    this.name = "CommonError";
    this.code = code;
    this.metadata = metadata;
  }
}