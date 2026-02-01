import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shoppingLists, shoppingListItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/shopping-lists/[id]
 * Get a specific shopping list
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const list = await db.query.shoppingLists.findFirst({
      where: eq(shoppingLists.id, id),
      with: { items: true },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching shopping list:", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping list" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/shopping-lists/[id]
 * Update a shopping list
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { list: listUpdate, items: itemsUpdate } = body;

    // Update list if data provided
    if (listUpdate) {
      await db
        .update(shoppingLists)
        .set({
          ...listUpdate,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(shoppingLists.id, id));
    }

    // Update items if provided
    if (itemsUpdate && Array.isArray(itemsUpdate)) {
      // Delete and recreate items
      await db.delete(shoppingListItems).where(eq(shoppingListItems.listId, id));

      if (itemsUpdate.length > 0) {
        await db.insert(shoppingListItems).values(
          itemsUpdate.map((item: any) => ({
            listId: id,
            itemName: item.itemName,
            category: item.category || null,
            quantity: item.quantity || 1,
            estimatedPrice: item.estimatedPrice || null,
            preferredVendor: item.preferredVendor || null,
            checked: item.checked || false,
            notes: item.notes || null,
          }))
        );

        // Recalculate estimated total
        const estimatedTotal = itemsUpdate.reduce(
          (sum: number, item: any) =>
            sum + (item.estimatedPrice || 0) * (item.quantity || 1),
          0
        );

        await db
          .update(shoppingLists)
          .set({ estimatedTotal })
          .where(eq(shoppingLists.id, id));
      }
    }

    // Fetch updated list
    const updatedList = await db.query.shoppingLists.findFirst({
      where: eq(shoppingLists.id, id),
      with: { items: true },
    });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error("Error updating shopping list:", error);
    return NextResponse.json(
      { error: "Failed to update shopping list" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shopping-lists/[id]
 * Delete a shopping list
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await db.delete(shoppingLists).where(eq(shoppingLists.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shopping list:", error);
    return NextResponse.json(
      { error: "Failed to delete shopping list" },
      { status: 500 }
    );
  }
}
