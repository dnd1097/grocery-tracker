import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.alternateNames !== undefined) {
      updateData.alternateNames = body.alternateNames;
    }

    if (body.category !== undefined) {
      updateData.category = body.category;
      updateData.categorySource = "manual";
    }

    if (body.displayName !== undefined) {
      updateData.displayName = body.displayName;
    }

    await db.update(items).set(updateData).where(eq(items.id, id));

    const updated = await db.query.items.findFirst({
      where: eq(items.id, id),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Item update error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}
