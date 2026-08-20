import { z } from "zod";

// Mirrors the Prisma `LeadType` enum.
export const leadTypeValues = [
  "samples",
  "estimate",
  "site_visit",
  "consultation",
  "callback",
  "partner",
] as const;

export type LeadTypeValue = (typeof leadTypeValues)[number];

// Loose phone check: 10-15 digits, optional leading +, spaces/dashes/parens allowed.
// The input mask on the client already constrains formatting; this just guards the API.
const phoneRegex = /^\+?[\d\s()-]{10,20}$/;

export const utmSchema = z
  .object({
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
  })
  .partial();

const contactFieldsSchema = {
  name: z.string().trim().min(2, "Введите имя").max(100),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Введите корректный номер телефона"),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  consent: z.literal(true, "Нужно согласие на обработку персональных данных"),
  // Honeypot: real users never fill this hidden field, bots often do.
  // Deliberately not rejected here — a validation error would tip bots off
  // to which field caught them. The route handler checks it and returns a
  // fake success instead.
  website: z.string().max(500).optional().default(""),
  pageUrl: z.string().max(500).optional(),
  utm: utmSchema.optional(),
};

export const leadFormSchema = z.object({
  type: z.enum(leadTypeValues),
  message: z.string().trim().max(2000).optional(),
  ...contactFieldsSchema,
});

export type LeadFormInput = z.infer<typeof leadFormSchema>;

export const sampleOrderSchema = z.object({
  ...contactFieldsSchema,
  address: z.string().trim().min(5, "Укажите адрес доставки").max(300),
  productSlugs: z
    .array(z.string())
    .min(1, "Добавьте хотя бы один образец")
    .max(5, "Можно выбрать не более 5 образцов"),
});

export type SampleOrderInput = z.infer<typeof sampleOrderSchema>;
