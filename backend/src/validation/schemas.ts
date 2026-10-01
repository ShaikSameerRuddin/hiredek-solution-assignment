import { z } from "zod";
import { parseDatetime } from "../domain/time.js";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const idNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().default(""),
});

export const clinicSchema = idNameSchema.extend({
  address: z.string().trim().min(1, "Address is required"),
  contact: z.string().trim().min(1, "Contact is required"),
  opticianIds: z.array(z.string().min(1)).min(1, "A clinic must employ at least one optician"),
});

export const opticianSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  intro: z.string().trim().default(""),
  serviceIds: z.array(z.string().min(1)).min(1, "An optician must offer at least one service"),
});

export const userSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["patient", "optician"]),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phoneNumber: z.string().trim().default(""),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Birthday must be YYYY-MM-DD"),
  opticianId: z.string().nullable().optional(),
});

export const appointmentSchema = z.object({
  clinicId: z.string().min(1),
  opticianId: z.string().min(1),
  serviceId: z.string().min(1),
  appointmentDatetime: z.string().refine((value) => parseDatetime(value) !== null, {
    message: "Choose one of the eight daily timeslots",
  }),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer").optional(),
});

export const catalogueQuerySchema = z.object({
  q: z.string().optional(),
  serviceId: z.string().optional(),
  clinicId: z.string().optional(),
  opticianId: z.string().optional(),
});

export const availabilityQuerySchema = z.object({
  clinicId: z.string().min(1),
  opticianId: z.string().min(1),
  serviceId: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});
