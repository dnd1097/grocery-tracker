import { db } from "@/lib/db";
import { receiptItems, receipts } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export interface PredictedItem {
  itemName: string;
  category: string | null;
  avgDaysBetweenPurchases: number;
  lastPurchaseDate: string;
  daysSinceLastPurchase: number;
  predictedNeedDate: string;
  shouldBuyNow: boolean;
  avgPrice: number;
  preferredVendor: string;
  purchaseCount: number;
  suggestedQuantity: number;
}

/**
 * Generate predicted shopping list based on purchase patterns
 * @param thresholdDays Number of days ahead to predict (default 7)
 * @returns Array of predicted items that should be purchased soon
 */
export async function getPredictedShoppingList(
  thresholdDays = 7
): Promise<PredictedItem[]> {
  // Get items with purchase patterns (need at least 2 purchases to establish pattern)
  const itemStats = await db
    .select({
      itemName: sql<string>`lower(trim(${receiptItems.rawName}))`,
      category: receiptItems.category,
      purchaseCount: sql<number>`count(*)`,
      lastPurchaseDate: sql<string>`max(${receipts.purchaseDate})`,
      firstPurchaseDate: sql<string>`min(${receipts.purchaseDate})`,
      avgPrice: sql<number>`avg(${receiptItems.totalPrice})`,
      avgQuantity: sql<number>`avg(${receiptItems.quantity})`,
      preferredVendor: sql<string>`(
        SELECT ${receipts.storeName}
        FROM ${receiptItems} ri2
        JOIN ${receipts} r2 ON ri2.receipt_id = r2.id
        WHERE lower(trim(ri2.raw_name)) = lower(trim(${receiptItems.rawName}))
        GROUP BY r2.store_name
        ORDER BY count(*) DESC
        LIMIT 1
      )`,
    })
    .from(receiptItems)
    .innerJoin(receipts, sql`${receiptItems.receiptId} = ${receipts.id}`)
    .groupBy(sql`lower(trim(${receiptItems.rawName}))`, receiptItems.category)
    .having(sql`count(*) >= 2`);

  const now = new Date();
  const predictions: PredictedItem[] = [];

  for (const item of itemStats) {
    const firstDate = new Date(item.firstPurchaseDate);
    const lastDate = new Date(item.lastPurchaseDate);
    const daysSinceLastPurchase = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate average days between purchases
    const totalDays = Math.floor(
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const avgDaysBetweenPurchases =
      item.purchaseCount > 1 ? totalDays / (item.purchaseCount - 1) : 0;

    // Skip if no pattern established
    if (avgDaysBetweenPurchases === 0) continue;

    // Predict next purchase date
    const predictedNeedDate = new Date(
      lastDate.getTime() + avgDaysBetweenPurchases * 24 * 60 * 60 * 1000
    );
    const daysUntilNeeded = Math.floor(
      (predictedNeedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Should buy if within threshold
    const shouldBuyNow = daysUntilNeeded <= thresholdDays;

    if (shouldBuyNow) {
      predictions.push({
        itemName: item.itemName,
        category: item.category,
        avgDaysBetweenPurchases,
        lastPurchaseDate: item.lastPurchaseDate,
        daysSinceLastPurchase,
        predictedNeedDate: predictedNeedDate.toISOString().split("T")[0],
        shouldBuyNow,
        avgPrice: item.avgPrice,
        preferredVendor: item.preferredVendor,
        purchaseCount: item.purchaseCount,
        suggestedQuantity: Math.round(item.avgQuantity),
      });
    }
  }

  // Sort by category, then by predicted need date
  return predictions.sort((a, b) => {
    if (a.category !== b.category) {
      return (a.category || "Other").localeCompare(b.category || "Other");
    }
    return a.predictedNeedDate.localeCompare(b.predictedNeedDate);
  });
}
