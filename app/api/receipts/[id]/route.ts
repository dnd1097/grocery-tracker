import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { receipts, receiptItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteReceiptImage } from "@/lib/services/image-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/receipts/[id]
 * Get a single receipt with all its items
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const receipt = await db.query.receipts.findFirst({
      where: eq(receipts.id, id),
      with: {
        items: {
          orderBy: (items, { asc }) => [asc(items.lineNumber)],
        },
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/receipts/[id]
 * Update a receipt and its items
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { receipt: receiptUpdate, items: itemsUpdate } = body;

    // Update receipt if data provided
    if (receiptUpdate) {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
        manuallyEdited: true,
      };

      if (receiptUpdate.storeName !== undefined)
        updateData.storeName = receiptUpdate.storeName;
      if (receiptUpdate.purchaseDate !== undefined)
        updateData.purchaseDate = receiptUpdate.purchaseDate;
      if (receiptUpdate.subtotal !== undefined)
        updateData.subtotal = receiptUpdate.subtotal;
      if (receiptUpdate.tax !== undefined) updateData.tax = receiptUpdate.tax;
      if (receiptUpdate.total !== undefined)
        updateData.total = receiptUpdate.total;
      if (receiptUpdate.notes !== undefined)
        updateData.notes = receiptUpdate.notes;

      await db.update(receipts).set(updateData).where(eq(receipts.id, id));
    }

    // Update items if provided
    if (itemsUpdate && Array.isArray(itemsUpdate)) {
      // Delete all existing items
      await db.delete(receiptItems).where(eq(receiptItems.receiptId, id));

      // Insert updated items
      if (itemsUpdate.length > 0) {
        await db.insert(receiptItems).values(
          itemsUpdate.map((item: any, index: number) => ({
            receiptId: id,
            rawName: item.rawName || item.name,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? null,
            totalPrice: item.totalPrice,
            category: item.category ?? null,
            lineNumber: item.lineNumber ?? index + 1,
            normalizedItemId: item.normalizedItemId ?? null,
            notes: item.notes ?? null,
          }))
        );
      }
    }

    // Fetch and return updated receipt
    const updatedReceipt = await db.query.receipts.findFirst({
      where: eq(receipts.id, id),
      with: {
        items: {
          orderBy: (items, { asc }) => [asc(items.lineNumber)],
        },
      },
    });

    if (!updatedReceipt) {
      return NextResponse.json(
        { error: "Receipt not found after update" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    console.error("Error updating receipt:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update receipt",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/receipts/[id]
 * Delete a receipt and its associated images
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get receipt to find image paths
    const receipt = await db.query.receipts.findFirst({
      where: eq(receipts.id, id),
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    // Delete from database (items will be cascade deleted)
    await db.delete(receipts).where(eq(receipts.id, id));

    // Delete images (non-blocking, errors logged)
    deleteReceiptImage(receipt.imagePath, receipt.thumbnailPath || "").catch(
      (err) => {
        console.error("Failed to delete receipt images:", err);
      }
    );

    return NextResponse.json({
      success: true,
      message: "Receipt deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting receipt:", error);
    return NextResponse.json(
      { error: "Failed to delete receipt" },
      { status: 500 }
    );
  }
}
