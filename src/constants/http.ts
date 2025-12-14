export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_ATTEMPTS: 429,
  INTERNAL_ERROR: 500,
} as const;

export const HTTP_MESSAGE = {
  OK: "Success",
  NO_CONTENT: "Success, No content to return",
  CREATED: "Created successfully",
  BAD_REQUEST: "Bad request",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",
  CONFLICT: "Conflict detected",
  TOO_MANY_ATTEMPTS: "Too many attempts. Please try again later.",
  INTERNAL_ERROR: "Internal server error",
} as const;
