export interface Receipt {
  id: string;
  storeName: string;
  purchaseDate: string;
  subtotal: number | null;
  tax: number | null;
  total: number;
  imagePath: string;
  thumbnailPath: string | null;
  parsedAt: string | null;
  parsingError: string | null;
  manuallyEdited: boolean;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  items?: ReceiptItem[];
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  rawName: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number;
  normalizedItemId: string | null;
  category: string | null;
  lineNumber: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
