import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shoppingLists, shoppingListItems } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

/**
 * GET /api/shopping-lists
 * List all shopping lists
 */
export async function GET(request: NextRequest) {
  try {
    const lists = await db.query.shoppingLists.findMany({
      orderBy: [desc(shoppingLists.createdAt)],
      with: {
        items: true,
      },
    });

    return NextResponse.json({ lists });
  } catch (error) {
    console.error("Error fetching shopping lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping lists" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shopping-lists
 * Create a new shopping list
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, items, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: "List name is required" },
        { status: 400 }
      );
    }

    // Create list
    const [list] = await db
      .insert(shoppingLists)
      .values({
        name,
        notes: notes || null,
        estimatedTotal: 0,
      })
      .returning();

    // Create items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const createdItems = await db
        .insert(shoppingListItems)
        .values(
          items.map((item: any) => ({
            listId: list.id,
            itemName: item.itemName,
            category: item.category || null,
            quantity: item.quantity || 1,
            estimatedPrice: item.estimatedPrice || null,
            preferredVendor: item.preferredVendor || null,
            checked: false,
          }))
        )
        .returning();

      // Calculate estimated total
      const estimatedTotal = createdItems.reduce(
        (sum, item) =>
          sum + (item.estimatedPrice || 0) * (item.quantity || 1),
        0
      );

      await db
        .update(shoppingLists)
        .set({ estimatedTotal })
        .where(eq(shoppingLists.id, list.id));
    }

    // Fetch complete list with items
    const completeList = await db.query.shoppingLists.findFirst({
      where: (lists, { eq }) => eq(lists.id, list.id),
      with: { items: true },
    });

    return NextResponse.json(completeList);
  } catch (error) {
    console.error("Error creating shopping list:", error);
    return NextResponse.json(
      { error: "Failed to create shopping list" },
      { status: 500 }
    );
  }
}
