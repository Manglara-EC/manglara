import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  json,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  twoFactorEnabled: boolean("two_factor_enabled"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").default("member").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const product = pgTable("product", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),

  stock: integer("stock").default(0).notNull(),
  images: json("images").$type<string[]>(),
  location: text("location"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isReservable: boolean("is_reservable").default(false).notNull(),

  sellerId: text("seller_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected' --> Confirm if rejected status is needed
  deleted: boolean("deleted").default(false).notNull(),

  approvedBy: text("approved_by").references(() => user.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const service = pgTable("service", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),

  // Tipo de servicio: accommodation, time_based, activity, other
  serviceType: text("service_type").default("other").notNull(),

  // Precio base y unidad
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  // 'hour', 'day', 'night', 'person', 'session', 'flat_rate'
  priceUnit: text("price_unit").default("flat_rate").notNull(),

  // Duración base en minutos (para servicios basados en tiempo)
  durationMinutes: integer("duration_minutes"),

  // Capacidad máxima (personas por sesión, huéspedes, etc.)
  maxCapacity: integer("max_capacity").default(1).notNull(),

  // Ubicación del servicio: coordenadas elegidas en el mapa + etiqueta de texto opcional
  location: text("location"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),

  // Configuración flexible por tipo de servicio (JSON)
  // Para accommodation: { checkInTime, checkOutTime, minNights, maxNights, amenities }
  // Para time_based: { durationOptions: [{ minutes, price }], bufferMinutes }
  // Para activity: { difficulty, requirements, inclusions, exclusions }
  serviceConfig: json("service_config").$type<ServiceConfig | null>(),

  // Reglas de disponibilidad (JSON)
  // { schedule: { monday: [{start, end}], ... }, blockedDates: [], exceptions: [] }
  availabilityRules: json(
    "availability_rules",
  ).$type<AvailabilityRules | null>(),

  // Reglas de cancelación
  cancellationPolicy: text("cancellation_policy").default("flexible"), // flexible, moderate, strict
  cancellationWindowHours: integer("cancellation_window_hours").default(24),

  // Imágenes
  images: json("images").$type<string[]>(),

  // Relaciones
  sellerId: text("seller_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Estado de publicación
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  deleted: boolean("deleted").default(false).notNull(),

  // Aprobación
  approvedBy: text("approved_by").references(() => user.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Tipos para configuraciones de servicios (usados en el schema)
export interface DurationOption {
  minutes: number;
  price: string;
  label?: string;
}

// Configuración específica para servicios de tipo "hammock"
export interface HammockConfig {
  hourlyPrice: string;
  dailyPrice: string;
}

export interface RentalConfig {
  pricingMode?: "hourly" | "daily";
  hourlyPrice?: string;
  dailyPrice?: string;
}

export interface ParkingConfig {
  hourlyPrice?: string;
  dailyPrice?: string;
  allowedVehicles: ("car" | "motorcycle" | "bicycle" | "bus")[];
  isRoofed: boolean;
  hasSecurity: boolean;
  hasCameras: boolean;
  isGated: boolean;
  surfaceType: "paved" | "dirt" | "sand";
}
export interface AccommodationConfig {
  checkInTime?: string; // "15:00"
  checkOutTime?: string; // "11:00"
  minNights?: number;
  maxNights?: number;
  amenities?: string[];
  houseRules?: string[];
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
}

export interface TimeBasedConfig {
  durationOptions?: DurationOption[];
  bufferMinutes?: number; // tiempo entre citas
  simultaneousBookings?: number; // cuántas reservas simultáneas permite
}

export interface ActivityConfig {
  difficulty?: "easy" | "moderate" | "challenging" | "expert";
  requirements?: string[];
  inclusions?: string[];
  exclusions?: string[];
  minParticipants?: number;
  meetingPoint?: string;
}

export type ServiceConfig =
  | AccommodationConfig
  | TimeBasedConfig
  | ActivityConfig
  | RentalConfig
  | ParkingConfig
  | Record<string, unknown>;

export interface TimeSlot {
  start: string; // "09:00"
  end: string; // "18:00"
}

export interface AvailabilityRules {
  schedule?: {
    monday?: TimeSlot[];
    tuesday?: TimeSlot[];
    wednesday?: TimeSlot[];
    thursday?: TimeSlot[];
    friday?: TimeSlot[];
    saturday?: TimeSlot[];
    sunday?: TimeSlot[];
  };
  blockedDates?: string[]; // ISO dates
  seasonalPricing?: {
    startDate: string;
    endDate: string;
    priceMultiplier: number;
  }[];
}

export const request = pgTable("request", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  type: text("type").notNull(), // 'product_request', 'product_approved', 'product_rejected', etc.
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),

  productId: text("product_id").references(() => product.id, {
    onDelete: "cascade",
  }),
  serviceId: text("service_id").references(() => service.id, {
    onDelete: "cascade",
  }),
  referenceType: text("reference_type").notNull(), // 'product' or 'service'

  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
