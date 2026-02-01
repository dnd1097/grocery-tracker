import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { receipts, receiptItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseReceipt } from "@/lib/services/receipt-parser";
import { categorizeItem } from "@/lib/utils/categories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/receipts/[id]/reparse
 * Re-parse a receipt image and replace all extracted data
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get existing receipt
    const receipt = await db.query.receipts.findFirst({
      where: eq(receipts.id, id),
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    // Re-parse the image
    let parsedData;
    try {
      parsedData = await parseReceipt(receipt.imagePath);
    } catch (parseError) {
      return NextResponse.json(
        {
          error:
            parseError instanceof Error
              ? parseError.message
              : "Parsing failed",
        },
        { status: 500 }
      );
    }

    // Update receipt
    await db
      .update(receipts)
      .set({
        storeName: parsedData.storeName,
        purchaseDate: parsedData.purchaseDate,
        subtotal: parsedData.subtotal ?? null,
        tax: parsedData.tax ?? null,
        total: parsedData.total,
        parsedAt: new Date().toISOString(),
        parsingError: null,
        manuallyEdited: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(receipts.id, id));

    // Delete old items
    await db.delete(receiptItems).where(eq(receiptItems.receiptId, id));

    // Create new items with auto-categorization
    const items = await db
      .insert(receiptItems)
      .values(
        parsedData.items.map((item, index) => ({
          receiptId: id,
          rawName: item.name,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? null,
          totalPrice: item.totalPrice,
          category: categorizeItem(item.name),
          lineNumber: index + 1,
        }))
      )
      .returning();

    return NextResponse.json({ success: true, itemCount: items.length });
  } catch (error) {
    console.error("Error re-parsing receipt:", error);
    return NextResponse.json(
      { error: "Failed to re-parse receipt" },
      { status: 500 }
    );
  }
}
