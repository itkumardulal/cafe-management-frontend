import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
  csrfToken: z.string().min(1, "CSRF token is required"),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
