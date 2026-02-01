import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";

export interface ParsedReceiptItem {
  name: string;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
}

export interface ParsedReceipt {
  storeName: string;
  purchaseDate: string; // ISO 8601 format (YYYY-MM-DD)
  items: ParsedReceiptItem[];
  subtotal?: number;
  tax?: number;
  total: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Get model from environment variable, default to claude-3-5-sonnet-20240620
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620";

/**
 * Parse a receipt image using Claude Vision API
 * @param imagePath - Path to the receipt image (relative to public directory)
 * @returns Parsed receipt data
 */
export async function parseReceipt(
  imagePath: string
): Promise<ParsedReceipt> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set"
    );
  }

  const client = new Anthropic({ apiKey });

  // Read image file
  const absolutePath = path.join(process.cwd(), "public", imagePath);
  const imageBuffer = await fs.readFile(absolutePath);
  const base64Image = imageBuffer.toString("base64");

  // Determine media type from file extension
  const ext = path.extname(imagePath).toLowerCase();
  let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/jpeg";
  if (ext === ".png") mediaType = "image/png";
  else if (ext === ".webp") mediaType = "image/webp";
  else if (ext === ".gif") mediaType = "image/gif";

  // Attempt parsing with retries
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: `Analyze this grocery receipt and extract the following information in JSON format:

{
  "storeName": "Store name",
  "purchaseDate": "YYYY-MM-DD",
  "items": [
    {
      "name": "Item name",
      "quantity": 1,
      "unitPrice": 0.00,
      "totalPrice": 0.00
    }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00
}

Guidelines:
- Extract ALL line items from the receipt
- Parse quantities carefully (look for "@ X for Y" or "qty: X")
- If unit price isn't shown, set it to null
- Ensure all prices are numeric (no currency symbols)
- Date should be in YYYY-MM-DD format
- If subtotal/tax aren't clearly shown, set them to null
- Be precise with item names as shown on receipt
- The total should be the final amount paid

Return ONLY the JSON, no additional text.`,
              },
            ],
          },
        ],
      });

      // Extract text from response
      const textContent = message.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text response from Claude");
      }

      // Parse JSON from response (handle code blocks)
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith("```")) {
        // Remove code block markers
        jsonText = jsonText
          .replace(/```json?\n?/g, "")
          .replace(/```$/g, "")
          .trim();
      }

      const parsed = JSON.parse(jsonText);

      // Validate required fields
      if (
        !parsed.storeName ||
        !parsed.purchaseDate ||
        !Array.isArray(parsed.items) ||
        parsed.total === undefined
      ) {
        throw new Error("Missing required fields in parsed receipt");
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.purchaseDate)) {
        throw new Error("Invalid date format in parsed receipt");
      }

      // Validate items
      for (const item of parsed.items) {
        if (!item.name || item.totalPrice === undefined) {
          throw new Error("Invalid item in parsed receipt");
        }
        // Ensure quantity has a default
        if (item.quantity === undefined) {
          item.quantity = 1;
        }
      }

      return parsed as ParsedReceipt;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unknown error");

      // Don't retry on validation errors (these won't be fixed by retrying)
      if (
        error instanceof Error &&
        (error.message.includes("Missing required fields") ||
          error.message.includes("Invalid"))
      ) {
        throw error;
      }

      // Wait before retrying
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * attempt)
        );
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to parse receipt after ${MAX_RETRIES} attempts: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Validate a parsed receipt object
 * @param receipt - The parsed receipt to validate
 * @returns true if valid, throws error otherwise
 */
export function validateParsedReceipt(
  receipt: unknown
): receipt is ParsedReceipt {
  if (typeof receipt !== "object" || receipt === null) {
    throw new Error("Receipt must be an object");
  }

  const r = receipt as Partial<ParsedReceipt>;

  if (typeof r.storeName !== "string" || r.storeName.trim() === "") {
    throw new Error("Store name is required");
  }

  if (typeof r.purchaseDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.purchaseDate)) {
    throw new Error("Purchase date must be in YYYY-MM-DD format");
  }

  if (!Array.isArray(r.items) || r.items.length === 0) {
    throw new Error("At least one item is required");
  }

  for (const item of r.items) {
    if (typeof item.name !== "string" || item.name.trim() === "") {
      throw new Error("Item name is required");
    }
    if (typeof item.totalPrice !== "number" || item.totalPrice < 0) {
      throw new Error("Item total price must be a non-negative number");
    }
    if (item.quantity !== undefined && (typeof item.quantity !== "number" || item.quantity <= 0)) {
      throw new Error("Item quantity must be a positive number");
    }
  }

  if (typeof r.total !== "number" || r.total < 0) {
    throw new Error("Total must be a non-negative number");
  }

  return true;
}
