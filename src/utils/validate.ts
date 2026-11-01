import type { ZodType } from "zod";
import { HttpError } from "./http-error.js";

export function parseBody<T>(schema: ZodType<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        const message = result.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ");
        throw new HttpError(400, message);
    }
    return result.data;
}
