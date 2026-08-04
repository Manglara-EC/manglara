import {
  pgTable,
  text,
  timestamp,
  decimal,
  integer,
} from "drizzle-orm/pg-core";

import { user, product, service } from "./schema";

// Pedido Padre (Para el Cliente)
export const parentOrder = pgTable("parent_order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  customerId: text("customer_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"), // completed, pending, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

//  Transacción por Vendedor (Hijo - Para cada Vendedor)
export const transactionHeader = pgTable("transaction_header", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  parentOrderId: text("parent_order_id")
    .notNull()
    .references(() => parentOrder.id, { onDelete: "cascade" }),
  sellerId: text("seller_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  customerId: text("customer_id")
    .notNull()
    .references(() => user.id),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull(), // completed, pending, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Línea de Transacción Genérica (Supertipo Financiero Común)
export const transactionLine = pgTable("transaction_line", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactionHeader.id, { onDelete: "cascade" }),

  type: text("type").notNull(), // 'product' o 'booking'

  // Auditoría e histórico financiero común
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  discount: decimal("discount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  taxes: decimal("taxes", { precision: 12, scale: 2 }).notNull().default("0"), // IVA
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

//  Detalle de Producto Comprado
export const productLine = pgTable("product_line", {
  transactionLineId: text("transaction_line_id")
    .primaryKey()
    .references(() => transactionLine.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => product.id),
});

// Detalle de Reserva (Servicio o Producto reservable)
export const bookingLine = pgTable("booking_line", {
  transactionLineId: text("transaction_line_id")
    .primaryKey()
    .references(() => transactionLine.id, { onDelete: "cascade" }),
  serviceId: text("service_id").references(() => service.id),
  productId: text("product_id").references(() => product.id),
  userId: text("user_id") // Duplicado para conveniencia de consultas rápidas del cliente
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Datos temporales obligatorios para las reservas
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  notes: text("notes"),
});
