import { z } from "zod";

export const createServiceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" })
    .max(200, { message: "El nombre debe tener menos de 200 caracteres" }),
  
  description: z
    .string()
    .trim()
    .max(1000, { message: "La descripción debe tener menos de 1000 caracteres" })
    .optional(),
  
  price: z
    .string()
    .regex(/^\d+\.?\d{0,2}$/, { message: "El precio debe ser un número válido" })
    .refine((val) => parseFloat(val) > 0, { 
      message: "El precio debe ser mayor a 0" 
    }),

  priceUnit: z.enum(['hour', 'day', 'person', 'flat_rate']).default('flat_rate'),
  durationMinutes: z.coerce.number().int().min(1).default(60),
  maxCapacity: z.coerce.number().int().min(1).default(1),
  cancellationWindowHours: z.coerce.number().int().min(0).default(24),
  images: z.array(z.url()).optional(),
  serviceType: z.string().optional(),
  serviceConfig: z.record(z.string(), z.any()).optional(),
  availabilityRules: z.record(z.string(), z.any()).optional(),
  cancellationPolicy: z.string().optional(),
  location: z.string().optional(),
  sellerId: z.string().min(1, { message: "Seller ID es requerido" }),
  organizationId: z.string().min(1, { message: "Organization ID es requerido" }),
});