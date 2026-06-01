import { z } from "zod";
import { passwordWithConfirmSchema } from "./password.schema";

export const activateSchema = passwordWithConfirmSchema.extend({
  token: z.string().min(1, "Invalid activation link"),
});

export type ActivateSchemaType = z.infer<typeof activateSchema>;
