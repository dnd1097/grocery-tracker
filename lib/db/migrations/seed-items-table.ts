import { db } from "../index";
import { receiptItems, items } from "../schema";
import { sql } from "drizzle-orm";
import { categorizeItem } from "../../utils/categories";
import { v4 as uuidv4 } from "uuid";

/**
 * Seeds the items table with data from existing receipt items.
 * This creates a canonical item record for each unique normalized name.
 */
export async function seedItemsTable() {
  console.log("Starting items table seed...");

  try {
    // Get all unique normalized names from receipt items
    const uniqueItems = await db
      .selectDistinct({
        normalizedName: sql<string>`lower(trim(${receiptItems.rawName}))`,
        category: receiptItems.category,
      })
      .from(receiptItems)
      .groupBy(sql`lower(trim(${receiptItems.rawName}))`);

    console.log(`Found ${uniqueItems.length} unique items to migrate`);

    // Track successful and failed inserts
    let successCount = 0;
    let failCount = 0;

    // Insert into items table
    for (const item of uniqueItems) {
      try {
        const autoCategory = categorizeItem(item.normalizedName);
        const category = item.category || autoCategory;

        await db.insert(items).values({
          id: uuidv4(),
          canonicalName: item.normalizedName,
          displayName: item.normalizedName,
          category: category,
          autoCategory: autoCategory,
          categorySource: item.category ? "manual" : "auto",
          alternateNames: null, // Initially empty
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        successCount++;

        if (successCount % 50 === 0) {
          console.log(`Processed ${successCount} items...`);
        }
      } catch (error) {
        failCount++;
        console.error(`Failed to insert item "${item.normalizedName}":`, error);
      }
    }

    console.log(
      `Items table seeded: ${successCount} successful, ${failCount} failed`
    );

    // Link receipt items to master items
    console.log("Linking receipt items to master items...");

    await db.run(sql`
      UPDATE receipt_items
      SET normalized_item_id = (
        SELECT id FROM items
        WHERE canonical_name = lower(trim(receipt_items.raw_name))
      )
    `);

    console.log("Receipt items linked to master items");

    // Verify linking
    const unlinkedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(receiptItems)
      .where(sql`normalized_item_id IS NULL`);

    if (unlinkedCount[0].count > 0) {
      console.warn(
        `Warning: ${unlinkedCount[0].count} receipt items could not be linked`
      );
    } else {
      console.log("All receipt items successfully linked!");
    }

    console.log("Items table seed complete!");
    return { success: successCount, failed: failCount };
  } catch (error) {
    console.error("Fatal error during seed:", error);
    throw error;
  }
}

// Allow running this script directly
if (require.main === module) {
  seedItemsTable()
    .then((result) => {
      console.log("Seed completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
