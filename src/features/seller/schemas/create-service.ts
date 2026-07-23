import { z } from "zod";

// ============================================================
// Sub-schemas para configuraciones específicas de tipo
// ============================================================

// Opción de duración (para servicios basados en tiempo)
const durationOptionSchema = z.object({
  minutes: z.number().int().min(1),
  price: z.string().regex(/^\d+\.?\d{0,2}$/, "Precio inválido"),
  label: z.string().optional(),
});

// Configuración para alojamientos
const accommodationConfigSchema = z.object({
  checkInTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato HH:MM")
    .optional(),
  checkOutTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato HH:MM")
    .optional(),
  minNights: z.number().int().min(1).optional(),
  maxNights: z.number().int().min(1).optional(),
  amenities: z.array(z.string()).optional(),
  houseRules: z.array(z.string()).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  beds: z.number().int().min(0).optional(),
});

// Configuración para servicios basados en tiempo
const timeBasedConfigSchema = z.object({
  durationOptions: z.array(durationOptionSchema).optional(),
  bufferMinutes: z.number().int().min(0).optional(),
  simultaneousBookings: z.number().int().min(1).optional(),
});

// Configuración para actividades/experiencias
const activityConfigSchema = z.object({
  difficulty: z.enum(["easy", "moderate", "challenging", "expert"]).optional(),
  requirements: z.array(z.string()).optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  minParticipants: z.number().int().min(1).optional(),
  meetingPoint: z.string().optional(),
});

// Schema de configuración flexible - usar passthrough para permitir campos adicionales
// y record para aceptar cualquier objeto JSON válido
const serviceConfigSchema = z
  .record(z.string(), z.unknown())
  .nullable()
  .optional();

// Slot de tiempo
const timeSlotSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
});

// Reglas de disponibilidad
const availabilityRulesSchema = z
  .object({
    schedule: z
      .object({
        monday: z.array(timeSlotSchema).optional(),
        tuesday: z.array(timeSlotSchema).optional(),
        wednesday: z.array(timeSlotSchema).optional(),
        thursday: z.array(timeSlotSchema).optional(),
        friday: z.array(timeSlotSchema).optional(),
        saturday: z.array(timeSlotSchema).optional(),
        sunday: z.array(timeSlotSchema).optional(),
      })
      .optional(),
    blockedDates: z.array(z.string()).optional(),
    seasonalPricing: z
      .array(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
          priceMultiplier: z.number().min(0),
        }),
      )
      .optional(),
  })
  .nullable()
  .optional();

// ============================================================
// Schema principal de creación de servicio
// ============================================================

export const createServiceSchema = z.object({
  // Campos básicos
  name: z
    .string()
    .trim()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" })
    .max(200, { message: "El nombre debe tener menos de 200 caracteres" }),

  description: z
    .string()
    .trim()
    .max(2000, {
      message: "La descripción debe tener menos de 2000 caracteres",
    })
    .optional(),

  // Tipo de servicio
  serviceType: z
    .enum(["accommodation", "activity", "rental", "parking"])
    .default("activity"),

  // Precio base
  price: z
    .string()
    .regex(/^\d+\.?\d{0,2}$/, {
      message: "El precio debe ser un número válido",
    })
    .refine((val) => parseFloat(val) > 0, {
      message: "El precio debe ser mayor a 0",
    }),

  // Unidad de precio
  priceUnit: z
    .enum(["night", "person", "day", "hour", "flat_rate"])
    .default("person"),

  // Duración base (minutos)
  durationMinutes: z.coerce.number().int().min(1).optional(),

  // Capacidad máxima
  maxCapacity: z.coerce.number().int().min(1).default(1),

  // Ubicación (solo texto, sin coordenadas)
  location: z.string().trim().max(500).optional(),

  // Configuración específica del tipo de servicio
  serviceConfig: serviceConfigSchema,

  // Reglas de disponibilidad
  availabilityRules: availabilityRulesSchema,

  // Política de cancelación
  cancellationPolicy: z
    .enum(["flexible", "moderate", "strict"])
    .default("flexible"),
  cancellationWindowHours: z.coerce.number().int().min(0).default(24),

  // Imágenes
  images: z.array(z.string().url()).optional(),

  // Relaciones (requeridos)
  sellerId: z.string().min(1, { message: "Seller ID es requerido" }),
  organizationId: z
    .string()
    .min(1, { message: "Organization ID es requerido" }),
});

// Schema para validaciones específicas por tipo de servicio
export const validateServiceByType = (
  data: z.infer<typeof createServiceSchema>,
) => {
  const errors: string[] = [];

  switch (data.serviceType) {
    case "accommodation":
      if (!data.location) {
        errors.push("La ubicación es requerida para alojamientos");
      }
      if (data.maxCapacity < 1) {
        errors.push("La capacidad debe ser al menos 1 huésped");
      }
      break;

    case "activity":
      if (data.maxCapacity < 1) {
        errors.push("La capacidad debe ser al menos 1 participante");
      }
      break;

    case "rental":
      const config = data.serviceConfig as {
        pricingMode?: "hourly" | "daily";
        hourlyPrice?: string;
        dailyPrice?: string;
      } | null;
      if (
        !config ||
        (config.pricingMode === "hourly" && !config.hourlyPrice) ||
        (config.pricingMode === "daily" && !config.dailyPrice)
      ) {
        errors.push(
          "Debes ingresar el precio correspondiente para la modalidad seleccionada",
        );
      }
      if (data.maxCapacity < 1) {
        errors.push("La cantidad disponible debe ser al menos 1");
      }
      break;

    case "parking":
      const parkingConfig = data.serviceConfig as {
        hourlyPrice?: string;
        dailyPrice?: string;
        allowedVehicles?: string[];
      } | null;
      if (
        !parkingConfig ||
        (!parkingConfig.hourlyPrice && !parkingConfig.dailyPrice)
      ) {
        errors.push(
          "Debes ingresar al menos una tarifa (por hora o por día completo)",
        );
      }
      if (
        !parkingConfig?.allowedVehicles ||
        parkingConfig.allowedVehicles.length === 0
      ) {
        errors.push("Debes seleccionar al menos un tipo de vehículo permitido");
      }
      if (!data.location) {
        errors.push("La ubicación del estacionamiento es requerida");
      }
      if (data.maxCapacity < 1) {
        errors.push("La cantidad de plazas disponibles debe ser al menos 1");
      }
      break;
  }

  return errors;
};

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
