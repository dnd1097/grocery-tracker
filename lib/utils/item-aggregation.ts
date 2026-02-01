import { db } from "@/lib/db";
import { receiptItems, receipts } from "@/lib/db/schema";
import { sql, and, inArray, like } from "drizzle-orm";

export interface AggregatedItem {
  normalizedName: string;
  category: string | null;
  purchaseCount: number;
  lastPurchaseDate: string;
  firstPurchaseDate: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  totalSpent: number;
  vendors: string[];
}

export interface ItemPurchaseInstance {
  id: string;
  rawName: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number;
  category: string | null;
  purchaseDate: string;
  storeName: string;
  receiptId: string;
}

/**
 * Get aggregated statistics for all items across receipts
 * @param filters Optional filters for vendors, categories, and search term
 * @returns Array of aggregated items with purchase statistics
 */
export async function getAggregatedItems(filters?: {
  vendors?: string[];
  categories?: string[];
  searchTerm?: string;
}): Promise<AggregatedItem[]> {
  const conditions = [];

  if (filters?.vendors && filters.vendors.length > 0) {
    conditions.push(inArray(receipts.storeName, filters.vendors));
  }

  if (filters?.categories && filters.categories.length > 0) {
    conditions.push(inArray(receiptItems.category, filters.categories));
  }

  if (filters?.searchTerm) {
    conditions.push(like(receiptItems.rawName, `%${filters.searchTerm}%`));
  }

  const items = await db
    .select({
      normalizedName: sql<string>`lower(trim(${receiptItems.rawName}))`,
      category: receiptItems.category,
      purchaseCount: sql<number>`count(*)`,
      lastPurchaseDate: sql<string>`max(${receipts.purchaseDate})`,
      firstPurchaseDate: sql<string>`min(${receipts.purchaseDate})`,
      avgPrice: sql<number>`avg(${receiptItems.totalPrice})`,
      minPrice: sql<number>`min(${receiptItems.totalPrice})`,
      maxPrice: sql<number>`max(${receiptItems.totalPrice})`,
      totalSpent: sql<number>`sum(${receiptItems.totalPrice})`,
      vendors: sql<string>`group_concat(distinct ${receipts.storeName})`,
    })
    .from(receiptItems)
    .innerJoin(receipts, sql`${receiptItems.receiptId} = ${receipts.id}`)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(
      sql`lower(trim(${receiptItems.rawName}))`,
      receiptItems.category
    );

  return items.map((item) => ({
    ...item,
    vendors: item.vendors ? item.vendors.split(",") : [],
  }));
}

/**
 * Get detailed purchase history for a specific item
 * @param normalizedName The normalized item name (lowercase, trimmed)
 * @returns Array of all purchase instances for this item
 */
export async function getItemPurchaseHistory(
  normalizedName: string
): Promise<ItemPurchaseInstance[]> {
  const items = await db
    .select({
      id: receiptItems.id,
      rawName: receiptItems.rawName,
      quantity: receiptItems.quantity,
      unitPrice: receiptItems.unitPrice,
      totalPrice: receiptItems.totalPrice,
      category: receiptItems.category,
      purchaseDate: receipts.purchaseDate,
      storeName: receipts.storeName,
      receiptId: receipts.id,
    })
    .from(receiptItems)
    .innerJoin(receipts, sql`${receiptItems.receiptId} = ${receipts.id}`)
    .where(
      sql`lower(trim(${receiptItems.rawName})) = ${normalizedName.toLowerCase().trim()}`
    )
    .orderBy(sql`${receipts.purchaseDate} desc`);

  return items;
}

/**
 * Get all unique vendors from receipts
 * @returns Array of unique vendor names
 */
export async function getAllVendors(): Promise<string[]> {
  const vendors = await db
    .selectDistinct({ storeName: receipts.storeName })
    .from(receipts)
    .orderBy(receipts.storeName);

  return vendors.map((v) => v.storeName);
}

/**
 * Get all unique categories from receipt items
 * @returns Array of unique category names
 */
export async function getAllCategories(): Promise<string[]> {
  const categories = await db
    .selectDistinct({ category: receiptItems.category })
    .from(receiptItems)
    .where(sql`${receiptItems.category} is not null`)
    .orderBy(receiptItems.category);

  return categories.map((c) => c.category!).filter(Boolean);
}
