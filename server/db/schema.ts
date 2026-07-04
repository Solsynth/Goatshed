import { pgTable, text, timestamp, boolean, jsonb, index, integer, decimal, pgEnum } from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", ["待支付", "已支付", "已完成", "已取消"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}, (table) => [index("session_userId_idx").on(table.userId)]);

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
  solarProfile: jsonb("solar_profile"),
  solarProfileUpdatedAt: timestamp("solar_profile_updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [index("account_userId_idx").on(table.userId)]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);

export const orders = pgTable("orders", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id").notNull().unique(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    productType: text("product_type").notNull().default("donation"),
    amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    quantity: integer("quantity").notNull().default(1),
    remarks: text("remarks"),
    status: orderStatus("status").notNull().default("待支付"),
    deliveryStatus: text("delivery_status").default("pending"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
    index("orders_orderId_idx").on(table.orderId),
    index("orders_userId_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_paidAt_idx").on(table.paidAt),
    index("orders_productType_idx").on(table.productType),
]);

export const gamingSession = pgTable("gaming_session", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    ticketCost: integer("ticket_cost").notNull().default(1),
    status: text("status").default("upcoming"),
    createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
    index("gaming_session_createdBy_idx").on(table.createdBy),
]);

export const sessionParticipant = pgTable("session_participant", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id").notNull().references(() => gamingSession.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    ticketsUsed: integer("tickets_used").notNull().default(1),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => [
    index("session_participant_sessionId_idx").on(table.sessionId),
    index("session_participant_userId_idx").on(table.userId),
]);
