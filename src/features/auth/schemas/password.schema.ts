import { z } from "zod";

export const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    strongPasswordRegex,
    "Password must include uppercase, lowercase, number, and special character",
  );

export const passwordChecklistRules = [
  { id: "length", label: "Minimum 8 characters", test: (v: string) => v.length >= 8 },
  {
    id: "upper",
    label: "One uppercase letter",
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    id: "lower",
    label: "One lowercase letter",
    test: (v: string) => /[a-z]/.test(v),
  },
  { id: "number", label: "One number", test: (v: string) => /\d/.test(v) },
  {
    id: "special",
    label: "One special character",
    test: (v: string) => /[^A-Za-z\d]/.test(v),
  },
] as const;

export const passwordWithConfirmSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
