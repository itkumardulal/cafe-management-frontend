import { z } from "zod";
import { strongPasswordSchema } from "@/src/features/auth/schemas/password.schema";

export const staffSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Valid email is required"),
  contactNumber: z.string().optional(),
  profileImage: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "CAFE_ADMIN", "STAFF"]),
  staffRoleId: z.string().uuid("Select a staff role"),
  password: z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v === "" || strongPasswordSchema.safeParse(v).success,
      { message: "Password does not meet requirements" },
    ),
});

export type StaffSchemaType = z.infer<typeof staffSchema>;

export const staffRoleSchema = z.object({
  name: z.string().min(2, "Role name is required").max(64),
  description: z.string().max(256).optional(),
  accessMenuCodes: z.array(z.string()).optional().default([]),
});

export type StaffRoleSchemaType = z.infer<typeof staffRoleSchema>;
