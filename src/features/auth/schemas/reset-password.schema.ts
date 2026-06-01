import { z } from "zod";
import { passwordWithConfirmSchema } from "./password.schema";

export const resetPasswordSchema = passwordWithConfirmSchema.extend({
  resetToken: z.string().min(1, "Reset session expired"),
});

export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;
