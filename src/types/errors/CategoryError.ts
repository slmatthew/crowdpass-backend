export const CategoryErrorCodes = {
  CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
  CATEGORY_SOFT_DELETED: "CATEGORY_SOFT_DELETED",
} as const;

export class CategoryError extends Error {
  code: string;
  metadata?: any;

  constructor(code: string, message: string, metadata?: any) {
    super(message);
    this.name = "CategoryError";
    this.code = code;
    this.metadata = metadata;
  }
}