import { db } from "@/lib/db";
import { receiptItems, receipts, items, customCategories } from "@/lib/db/schema";
import { sql, and, inArray, like, or, eq } from "drizzle-orm";
import { getAllCategories as mergeCategories, DEFAULT_GROCERY_CATEGORIES } from "./categories";

export interface AggregatedItem {
  itemId: string;
  normalizedName: string;
  displayName: string | null;
  category: string | null;
  categorySource: string | null;
  alternateNames: string | null;
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
  quantity: number | null;
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
    conditions.push(inArray(items.category, filters.categories));
  }

  if (filters?.searchTerm) {
    const term = `%${filters.searchTerm.toLowerCase()}%`;
    conditions.push(
      or(
        like(items.canonicalName, term),
        like(items.displayName, term),
        like(items.alternateNames, term)
      )
    );
  }

  const aggregated = await db
    .select({
      itemId: items.id,
      normalizedName: items.canonicalName,
      displayName: items.displayName,
      category: items.category,
      categorySource: items.categorySource,
      alternateNames: items.alternateNames,
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
    .innerJoin(receipts, eq(receiptItems.receiptId, receipts.id))
    .leftJoin(items, eq(receiptItems.normalizedItemId, items.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(items.id);

  return aggregated
    .filter((item) => item.itemId !== null && item.normalizedName !== null)
    .map((item) => ({
      itemId: item.itemId!,
      normalizedName: item.normalizedName!,
      displayName: item.displayName,
      category: item.category,
      categorySource: item.categorySource,
      alternateNames: item.alternateNames,
      purchaseCount: item.purchaseCount,
      lastPurchaseDate: item.lastPurchaseDate,
      firstPurchaseDate: item.firstPurchaseDate,
      avgPrice: item.avgPrice,
      minPrice: item.minPrice,
      maxPrice: item.maxPrice,
      totalSpent: item.totalSpent,
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
 * Get all unique categories from items and custom categories
 * @returns Array of unique category names (default + custom + used categories)
 */
export async function getAllCategories(): Promise<string[]> {
  // Get custom categories from database
  const customCats = await db.select().from(customCategories);
  const customCatNames = customCats.map((c) => c.name);

  // Get categories that are actually used in items
  const usedCategories = await db
    .selectDistinct({ category: items.category })
    .from(items)
    .where(sql`${items.category} is not null`)
    .orderBy(items.category);

  const usedCatNames = usedCategories.map((c) => c.category!).filter(Boolean);

  // Merge all categories: default + custom + used
  const allCategories = mergeCategories(customCatNames);

  // Add any used categories that aren't in the list yet
  const finalCategories = new Set(allCategories);
  usedCatNames.forEach((cat) => finalCategories.add(cat));

  return Array.from(finalCategories).sort();
}
