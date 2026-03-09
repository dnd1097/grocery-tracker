import { db } from "../db";
import { items } from "../db/schema";
import { eq } from "drizzle-orm";
import { categorizeItem } from "./categories";
import { v4 as uuidv4 } from "uuid";

/**
 * Ensures an item master record exists for a given raw item name.
 * If the item doesn't exist, creates it with auto-categorization.
 * Returns the item master ID for linking to receipt items.
 *
 * @param rawName - The raw item name from the receipt
 * @param category - Optional manual category override
 * @returns The item master ID
 */
export async function ensureItemMasterLink(
  rawName: string,
  category?: string | null
): Promise<string> {
  const normalizedName = rawName.toLowerCase().trim();

  // Find existing item
  let item = await db.query.items.findFirst({
    where: eq(items.canonicalName, normalizedName),
  });

  // Create if doesn't exist
  if (!item) {
    const autoCategory = categorizeItem(normalizedName);
    const finalCategory = category || autoCategory;

    const [newItem] = await db
      .insert(items)
      .values({
        id: uuidv4(),
        canonicalName: normalizedName,
        displayName: normalizedName,
        category: finalCategory,
        autoCategory: autoCategory,
        categorySource: category ? "manual" : "auto",
        alternateNames: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    item = newItem;
  }

  return item.id;
}

/**
 * Batch version of ensureItemMasterLink for multiple items.
 * More efficient than calling ensureItemMasterLink in a loop.
 *
 * @param rawNames - Array of raw item names from receipts
 * @returns Map of normalized name to item master ID
 */
export async function ensureItemMasterLinkBatch(
  rawNames: { name: string; category?: string | null }[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const normalizedNames = rawNames.map((item) => ({
    normalized: item.name.toLowerCase().trim(),
    original: item.name,
    category: item.category,
  }));

  // Get existing items
  const existingItems = await db.query.items.findMany({
    where: (items, { inArray }) =>
      inArray(
        items.canonicalName,
        normalizedNames.map((n) => n.normalized)
      ),
  });

  // Map existing items
  const existingMap = new Map<string, string>();
  existingItems.forEach((item) => {
    existingMap.set(item.canonicalName, item.id);
  });

  // Create missing items
  const toCreate = normalizedNames.filter(
    (n) => !existingMap.has(n.normalized)
  );

  if (toCreate.length > 0) {
    const newItems = await db
      .insert(items)
      .values(
        toCreate.map((item) => {
          const autoCategory = categorizeItem(item.normalized);
          const finalCategory = item.category || autoCategory;

          return {
            id: uuidv4(),
            canonicalName: item.normalized,
            displayName: item.normalized,
            category: finalCategory,
            autoCategory: autoCategory,
            categorySource: item.category ? "manual" : "auto",
            alternateNames: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        })
      )
      .returning();

    // Add newly created items to result
    newItems.forEach((item) => {
      existingMap.set(item.canonicalName, item.id);
    });
  }

  // Build result map with original normalized names
  normalizedNames.forEach((item) => {
    const itemId = existingMap.get(item.normalized);
    if (itemId) {
      result.set(item.normalized, itemId);
    }
  });

  return result;
}
