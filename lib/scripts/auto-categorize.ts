import { db } from "@/lib/db";
import { receiptItems } from "@/lib/db/schema";
import { categorizeItem } from "@/lib/utils/categories";
import { eq, isNull, or } from "drizzle-orm";

/**
 * Auto-categorizes all items in the database that don't have a category assigned
 * This can be run manually to categorize existing items after adding the category feature
 */
export async function autoCategorizeAllItems() {
  console.log("Starting auto-categorization of receipt items...");

  // Get all items without categories
  const items = await db.query.receiptItems.findMany({
    where: or(isNull(receiptItems.category), eq(receiptItems.category, "")),
  });

  console.log(`Found ${items.length} items to categorize`);

  if (items.length === 0) {
    console.log("No items need categorization");
    return { total: 0, updated: 0 };
  }

  let updated = 0;
  const batchSize = 100;

  // Process in batches for better performance
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    for (const item of batch) {
      const category = categorizeItem(item.rawName);

      await db
        .update(receiptItems)
        .set({
          category,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(receiptItems.id, item.id));

      updated++;

      if (updated % 50 === 0) {
        console.log(`Progress: ${updated}/${items.length} items categorized`);
      }
    }
  }

  console.log(`✓ Successfully categorized ${updated} items`);
  return { total: items.length, updated };
}

// Allow running as a standalone script
if (require.main === module) {
  autoCategorizeAllItems()
    .then(({ total, updated }) => {
      console.log(`\nCategorization complete:`);
      console.log(`  Total items: ${total}`);
      console.log(`  Updated: ${updated}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error during categorization:", error);
      process.exit(1);
    });
}
