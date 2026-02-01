import { NextRequest, NextResponse } from "next/server";
import { getPredictedShoppingList } from "@/lib/utils/shopping-predictions";

/**
 * GET /api/shopping-lists/predictions
 * Generate predicted shopping list based on purchase patterns
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const threshold = parseInt(searchParams.get("threshold") || "7");

    const predictions = await getPredictedShoppingList(threshold);

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error("Error generating predictions:", error);
    return NextResponse.json(
      { error: "Failed to generate predictions" },
      { status: 500 }
    );
  }
}
