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

  // Category
  category: text("category"),

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

// Shopping lists table
export const shoppingLists = sqliteTable("shopping_lists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // active, completed
  estimatedTotal: real("estimated_total"),
  completedAt: text("completed_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  notes: text("notes"),
});

// Shopping list items table
export const shoppingListItems = sqliteTable("shopping_list_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  listId: text("list_id")
    .notNull()
    .references(() => shoppingLists.id, { onDelete: "cascade" }),
  itemName: text("item_name").notNull(),
  category: text("category"),
  quantity: real("quantity").default(1),
  estimatedPrice: real("estimated_price"),
  preferredVendor: text("preferred_vendor"),
  checked: integer("checked", { mode: "boolean" }).default(false),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Items master table (canonical items for categorization and aggregation)
export const items = sqliteTable("items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  canonicalName: text("canonical_name").notNull().unique(), // Normalized: lower(trim())
  displayName: text("display_name"), // Optional prettier display
  category: text("category"), // Manual override category
  alternateNames: text("alternate_names"), // Comma-separated alternate names
  autoCategory: text("auto_category"), // Original auto-categorized value
  categorySource: text("category_source").default("auto"), // 'auto' or 'manual'
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Custom categories table
export const customCategories = sqliteTable("custom_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: text("name").notNull().unique(),
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
  item: one(items, {
    fields: [receiptItems.normalizedItemId],
    references: [items.id],
  }),
}));

export const shoppingListsRelations = relations(shoppingLists, ({ many }) => ({
  items: many(shoppingListItems),
}));

export const shoppingListItemsRelations = relations(
  shoppingListItems,
  ({ one }) => ({
    list: one(shoppingLists, {
      fields: [shoppingListItems.listId],
      references: [shoppingLists.id],
    }),
  })
);

export const itemsRelations = relations(items, ({ many }) => ({
  receiptItems: many(receiptItems),
}));

// Type exports for use in application code
export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;
export type ReceiptItem = typeof receiptItems.$inferSelect;
export type NewReceiptItem = typeof receiptItems.$inferInsert;
export type ShoppingList = typeof shoppingLists.$inferSelect;
export type NewShoppingList = typeof shoppingLists.$inferInsert;
export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type NewShoppingListItem = typeof shoppingListItems.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type CustomCategory = typeof customCategories.$inferSelect;
export type NewCustomCategory = typeof customCategories.$inferInsert;
