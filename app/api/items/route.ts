import { NextRequest, NextResponse } from "next/server";
import {
  getAggregatedItems,
  getItemPurchaseHistory,
  getAllVendors,
  getAllCategories,
} from "@/lib/utils/item-aggregation";

/**
 * GET /api/items
 * List aggregated items or get purchase history for a specific item
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendors = searchParams
      .get("vendors")
      ?.split(",")
      .filter(Boolean);
    const categories = searchParams
      .get("categories")
      ?.split(",")
      .filter(Boolean);
    const searchTerm = searchParams.get("search") || undefined;
    const itemName = searchParams.get("itemName");
    const getFilters = searchParams.get("filters") === "true";

    // If requesting filter options
    if (getFilters) {
      const [allVendors, allCategories] = await Promise.all([
        getAllVendors(),
        getAllCategories(),
      ]);

      return NextResponse.json({
        vendors: allVendors,
        categories: allCategories,
      });
    }

    // If itemName provided, return purchase history
    if (itemName) {
      const history = await getItemPurchaseHistory(itemName);
      return NextResponse.json({ history });
    }

    // Otherwise return aggregated items
    const items = await getAggregatedItems({
      vendors,
      categories,
      searchTerm,
    });

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
