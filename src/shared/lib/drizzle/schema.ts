import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  json
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
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  
  // 'hour', 'day', 'person', 'flat_rate'
  priceUnit: text("price_unit").default("flat_rate").notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  
  // Capacidad máxima por turno (ej: 10 personas para un tour, 1 para una cita)
  maxCapacity: integer("max_capacity").default(1).notNull(),
  requiresCheckIn: boolean("requires_check_in").default(false).notNull(),
  
  // Reglas de cancelación (ej: horas antes para reembolso)
  cancellationWindowHours: integer("cancellation_window_hours").default(24),
  availabilitySchedule: json("availability"),
  images: json("images").$type<string[]>(),

  sellerId: text("seller_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(), // Estado de PUBLICACIÓN (no de la reserva)
  deleted: boolean("deleted").default(false).notNull(),

  approvedBy: text("approved_by").references(() => user.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

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

  productId: text("product_id").references(() => product.id, { onDelete: "cascade" }),
  serviceId: text("service_id").references(() => service.id, { onDelete: "cascade" }),
  referenceType: text("reference_type").notNull(), // 'product' or 'service'

  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const transactionHeader = pgTable("transaction_header", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => user.id),
  sellerId: text("seller_id")
    .notNull()
    .references(() => user.id),
  status: text("status").notNull(),
});

export const lineItem = pgTable("line_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactionHeader.id, { onDelete: "cascade" }),
  itemId: text("item_id")
    .notNull()
    .references(() => product.id),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).notNull(),
  taxes: decimal("taxes", { precision: 12, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
});