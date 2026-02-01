import { db } from "@/lib/db";
import { receipts, receiptItems } from "@/lib/db/schema";
import { sql, and, gte, lte } from "drizzle-orm";

export interface SpendingByVendor {
  vendor: string;
  total: number;
  percentage: number;
}

export interface SpendingByCategory {
  category: string;
  total: number;
  count: number;
}

export interface MonthlySpending {
  month: string; // YYYY-MM
  total: number;
  receiptCount: number;
}

export interface TopItem {
  itemName: string;
  purchaseCount: number;
  totalSpent: number;
  avgPrice: number;
}

/**
 * Get spending breakdown by vendor
 */
export async function getSpendingByVendor(
  dateFrom?: string,
  dateTo?: string
): Promise<SpendingByVendor[]> {
  const conditions = [];
  if (dateFrom) conditions.push(gte(receipts.purchaseDate, dateFrom));
  if (dateTo) conditions.push(lte(receipts.purchaseDate, dateTo));

  const results = await db
    .select({
      vendor: receipts.storeName,
      total: sql<number>`sum(${receipts.total})`,
    })
    .from(receipts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(receipts.storeName)
    .orderBy(sql`sum(${receipts.total}) desc`);

  const grandTotal = results.reduce((sum, r) => sum + r.total, 0);

  return results.map((r) => ({
    vendor: r.vendor,
    total: r.total,
    percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));
}

/**
 * Get spending breakdown by category
 */
export async function getSpendingByCategory(
  dateFrom?: string,
  dateTo?: string
): Promise<SpendingByCategory[]> {
  const conditions = [];
  if (dateFrom) conditions.push(gte(receipts.purchaseDate, dateFrom));
  if (dateTo) conditions.push(lte(receipts.purchaseDate, dateTo));

  const results = await db
    .select({
      category: sql<string>`coalesce(${receiptItems.category}, 'Other')`,
      total: sql<number>`sum(${receiptItems.totalPrice})`,
      count: sql<number>`count(*)`,
    })
    .from(receiptItems)
    .innerJoin(receipts, sql`${receiptItems.receiptId} = ${receipts.id}`)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(sql`coalesce(${receiptItems.category}, 'Other')`)
    .orderBy(sql`sum(${receiptItems.totalPrice}) desc`);

  return results;
}

/**
 * Get monthly spending trends
 */
export async function getMonthlySpending(
  dateFrom?: string,
  dateTo?: string
): Promise<MonthlySpending[]> {
  const conditions = [];
  if (dateFrom) conditions.push(gte(receipts.purchaseDate, dateFrom));
  if (dateTo) conditions.push(lte(receipts.purchaseDate, dateTo));

  const results = await db
    .select({
      month: sql<string>`strftime('%Y-%m', ${receipts.purchaseDate})`,
      total: sql<number>`sum(${receipts.total})`,
      receiptCount: sql<number>`count(*)`,
    })
    .from(receipts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(sql`strftime('%Y-%m', ${receipts.purchaseDate})`)
    .orderBy(sql`strftime('%Y-%m', ${receipts.purchaseDate}) asc`);

  return results;
}

/**
 * Get top purchased items
 */
export async function getTopItems(
  limit = 10,
  dateFrom?: string,
  dateTo?: string
): Promise<TopItem[]> {
  const conditions = [];
  if (dateFrom) conditions.push(gte(receipts.purchaseDate, dateFrom));
  if (dateTo) conditions.push(lte(receipts.purchaseDate, dateTo));

  const results = await db
    .select({
      itemName: sql<string>`lower(trim(${receiptItems.rawName}))`,
      purchaseCount: sql<number>`count(*)`,
      totalSpent: sql<number>`sum(${receiptItems.totalPrice})`,
      avgPrice: sql<number>`avg(${receiptItems.totalPrice})`,
    })
    .from(receiptItems)
    .innerJoin(receipts, sql`${receiptItems.receiptId} = ${receipts.id}`)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(sql`lower(trim(${receiptItems.rawName}))`)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  return results;
}
