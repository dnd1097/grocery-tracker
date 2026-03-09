import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { itemIds, category } = await request.json();

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "Item IDs are required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    await db
      .update(items)
      .set({
        category,
        categorySource: "manual",
        updatedAt: new Date().toISOString(),
      })
      .where(inArray(items.id, itemIds));

    return NextResponse.json({
      success: true,
      updated: itemIds.length,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { error: "Failed to update items" },
      { status: 500 }
    );
  }
}
