import { z } from "zod";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      strongPasswordRegex,
      "Password must include uppercase, lowercase, number, and special character",
    ),
  rememberMe: z.boolean().optional(),
  csrfToken: z.string().min(1, "CSRF token is required"),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
