import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Receipts table
export const receipts = sqliteTable("receipts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  storeName: text("store_name").notNull(),
  purchaseDate: text("purchase_date").notNull(), // ISO 8601 date string
  subtotal: real("subtotal"),
  tax: real("tax"),
  total: real("total").notNull(),

  // Image storage
  imagePath: text("image_path").notNull(),
  thumbnailPath: text("thumbnail_path"),

  // Parsing metadata
  parsedAt: text("parsed_at"),
  parsingError: text("parsing_error"), // Store parsing errors if any
  manuallyEdited: integer("manually_edited", { mode: "boolean" }).default(
    false
  ),

  // Timestamps
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),

  // Notes/tags (optional)
  notes: text("notes"),
});

// Receipt items table
export const receiptItems = sqliteTable("receipt_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  receiptId: text("receipt_id")
    .notNull()
    .references(() => receipts.id, { onDelete: "cascade" }),

  // Item details as parsed
  rawName: text("raw_name").notNull(),
  quantity: real("quantity").default(1),
  unitPrice: real("unit_price"),
  totalPrice: real("total_price").notNull(),

  // Normalization (for future phases)
  normalizedItemId: text("normalized_item_id"),

  // Metadata
  lineNumber: integer("line_number"),
  notes: text("notes"), // User notes for line items

  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Define relationships
export const receiptsRelations = relations(receipts, ({ many }) => ({
  items: many(receiptItems),
}));

export const receiptItemsRelations = relations(receiptItems, ({ one }) => ({
  receipt: one(receipts, {
    fields: [receiptItems.receiptId],
    references: [receipts.id],
  }),
}));

// Type exports for use in application code
export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;
export type ReceiptItem = typeof receiptItems.$inferSelect;
export type NewReceiptItem = typeof receiptItems.$inferInsert;
