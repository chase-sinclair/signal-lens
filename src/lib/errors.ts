export function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [
      record.message,
      record.details,
      record.hint,
      record.code,
    ].filter(
      (value): value is string =>
        typeof value === "string" && value.length > 0,
    );

    if (parts.length > 0) return parts.join(" ");
  }

  return fallback;
}
