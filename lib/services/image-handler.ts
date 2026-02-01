import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

export interface SavedImage {
  imagePath: string;
  thumbnailPath: string;
}

const UPLOADS_DIR = path.join(process.cwd(), "public/uploads");
const RECEIPTS_DIR = path.join(UPLOADS_DIR, "receipts");
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, "thumbnails");
const THUMBNAIL_WIDTH = 300;

/**
 * Ensure upload directories exist
 */
async function ensureDirectoriesExist(): Promise<void> {
  await fs.mkdir(RECEIPTS_DIR, { recursive: true });
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
}

/**
 * Save a receipt image and generate a thumbnail
 * @param file - The uploaded file (Buffer or File)
 * @param filename - Original filename (optional, for extension detection)
 * @returns Object with paths to the saved image and thumbnail
 */
export async function saveReceiptImage(
  buffer: Buffer,
  originalFilename?: string
): Promise<SavedImage> {
  await ensureDirectoriesExist();

  const uuid = uuidv4();

  // Determine file extension
  let ext = ".jpg";
  if (originalFilename) {
    const origExt = path.extname(originalFilename).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(origExt)) {
      ext = origExt === ".jpeg" ? ".jpg" : origExt;
    }
  }

  // Paths relative to public directory (for serving)
  const imagePath = `/uploads/receipts/${uuid}${ext}`;
  const thumbnailPath = `/uploads/thumbnails/${uuid}.jpg`;

  // Absolute paths for file system operations
  const absoluteImagePath = path.join(process.cwd(), "public", imagePath);
  const absoluteThumbnailPath = path.join(
    process.cwd(),
    "public",
    thumbnailPath
  );

  try {
    // Save original image
    await fs.writeFile(absoluteImagePath, buffer);

    // Generate thumbnail using sharp
    await sharp(buffer)
      .resize(THUMBNAIL_WIDTH, null, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .jpeg({ quality: 80 })
      .toFile(absoluteThumbnailPath);

    return { imagePath, thumbnailPath };
  } catch (error) {
    // Clean up if thumbnail generation fails
    try {
      await fs.unlink(absoluteImagePath);
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(
      `Failed to save receipt image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Delete a receipt image and its thumbnail
 * @param imagePath - Path to the original image (relative to public)
 * @param thumbnailPath - Path to the thumbnail (relative to public)
 */
export async function deleteReceiptImage(
  imagePath: string,
  thumbnailPath: string
): Promise<void> {
  const absoluteImagePath = path.join(process.cwd(), "public", imagePath);
  const absoluteThumbnailPath = path.join(
    process.cwd(),
    "public",
    thumbnailPath
  );

  try {
    await fs.unlink(absoluteImagePath);
  } catch (error) {
    console.error(`Failed to delete image: ${imagePath}`, error);
  }

  try {
    if (thumbnailPath) {
      await fs.unlink(absoluteThumbnailPath);
    }
  } catch (error) {
    console.error(`Failed to delete thumbnail: ${thumbnailPath}`, error);
  }
}

/**
 * Check if a file is a valid image
 * @param buffer - File buffer to check
 * @returns true if valid image, false otherwise
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return (
      metadata.format !== undefined &&
      ["jpeg", "png", "webp", "heic", "heif"].includes(metadata.format)
    );
  } catch {
    return false;
  }
}

/**
 * Get image metadata
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width?: number;
  height?: number;
  format?: string;
  size: number;
}> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: buffer.length,
  };
}
