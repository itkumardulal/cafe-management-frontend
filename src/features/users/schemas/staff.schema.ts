import { z } from "zod";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export const staffSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      strongPasswordRegex,
      "Password must include uppercase, lowercase, number, and special character",
    ),
  contactNumber: z.string().optional(),
  profileImage: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "CAFE_ADMIN", "STAFF"]),
  accessMenuCodes: z.array(z.string()).optional(),
});

export type StaffSchemaType = z.infer<typeof staffSchema>;
