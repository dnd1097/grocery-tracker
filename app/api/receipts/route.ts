import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { receipts, receiptItems } from "@/lib/db/schema";
import { saveReceiptImage, isValidImage } from "@/lib/services/image-handler";
import { parseReceipt } from "@/lib/services/receipt-parser";
import { categorizeItem } from "@/lib/utils/categories";
import { desc, and, gte, lte, like } from "drizzle-orm";

/**
 * GET /api/receipts
 * List all receipts with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const store = searchParams.get("store");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build query conditions
    const conditions = [];
    if (store) {
      conditions.push(like(receipts.storeName, `%${store}%`));
    }
    if (dateFrom) {
      conditions.push(gte(receipts.purchaseDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(receipts.purchaseDate, dateTo));
    }

    // Query receipts
    const allReceipts = await db.query.receipts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(receipts.purchaseDate), desc(receipts.createdAt)],
      with: {
        items: true,
      },
    });

    return NextResponse.json({
      receipts: allReceipts,
      count: allReceipts.length,
    });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/receipts
 * Upload and parse a new receipt
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate it's an image
    const isImage = await isValidImage(buffer);
    if (!isImage) {
      return NextResponse.json(
        { error: "Invalid image file" },
        { status: 400 }
      );
    }

    // Save image and generate thumbnail
    const { imagePath, thumbnailPath } = await saveReceiptImage(
      buffer,
      file.name
    );

    // Parse receipt with Claude Vision
    let parsedData;
    try {
      parsedData = await parseReceipt(imagePath);
    } catch (parseError) {
      // If parsing fails, create a receipt with minimal data
      // User can edit it manually
      console.error("Receipt parsing failed:", parseError);

      // Create a basic receipt record with error stored
      const errorMessage = parseError instanceof Error
        ? parseError.message
        : "Unknown parsing error";

      const [receipt] = await db
        .insert(receipts)
        .values({
          storeName: "Unknown Store",
          purchaseDate: new Date().toISOString().split("T")[0],
          total: 0,
          imagePath,
          thumbnailPath,
          parsedAt: null,
          parsingError: errorMessage,
          manuallyEdited: false,
        })
        .returning();

      return NextResponse.json({
        receipt,
        items: [],
        parsingFailed: true,
        parsingError: errorMessage,
      });
    }

    // Create receipt record
    const [receipt] = await db
      .insert(receipts)
      .values({
        storeName: parsedData.storeName,
        purchaseDate: parsedData.purchaseDate,
        subtotal: parsedData.subtotal ?? null,
        tax: parsedData.tax ?? null,
        total: parsedData.total,
        imagePath,
        thumbnailPath,
        parsedAt: new Date().toISOString(),
        manuallyEdited: false,
      })
      .returning();

    // Create receipt items with auto-categorization
    const items = await db
      .insert(receiptItems)
      .values(
        parsedData.items.map((item, index) => ({
          receiptId: receipt.id,
          rawName: item.name,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? null,
          totalPrice: item.totalPrice,
          category: categorizeItem(item.name),
          lineNumber: index + 1,
        }))
      )
      .returning();

    return NextResponse.json({
      receipt,
      items,
      parsingFailed: false,
    });
  } catch (error) {
    console.error("Error creating receipt:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create receipt",
      },
      { status: 500 }
    );
  }
}
