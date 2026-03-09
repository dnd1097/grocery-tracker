import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - List all custom categories
export async function GET() {
  try {
    const categories = await db
      .select()
      .from(customCategories)
      .orderBy(customCategories.name);

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch custom categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Create a new custom category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check if category already exists
    const existing = await db
      .select()
      .from(customCategories)
      .where(eq(customCategories.name, trimmedName))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 }
      );
    }

    const [newCategory] = await db
      .insert(customCategories)
      .values({ name: trimmedName })
      .returning();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Failed to create custom category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a custom category
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    await db.delete(customCategories).where(eq(customCategories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete custom category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
