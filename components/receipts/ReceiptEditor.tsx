"use client";

import { useState } from "react";
import { Receipt, ReceiptItem } from "@/types/receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, Save, X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ReceiptEditorProps {
  receipt: Receipt;
  categories: string[];
}

export function ReceiptEditor({ receipt: initialReceipt, categories }: ReceiptEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [receipt, setReceipt] = useState(initialReceipt);
  const [items, setItems] = useState<ReceiptItem[]>(initialReceipt.items || []);
  const [showReparseDialog, setShowReparseDialog] = useState(false);
  const [isReparsing, setIsReparsing] = useState(false);
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/receipts/${receipt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt: {
            storeName: receipt.storeName,
            purchaseDate: receipt.purchaseDate,
            subtotal: receipt.subtotal,
            tax: receipt.tax,
            total: receipt.total,
            notes: receipt.notes,
          },
          items: items.map((item) => ({
            rawName: item.rawName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            category: item.category,
            lineNumber: item.lineNumber,
            notes: item.notes,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save receipt");
      }

      const updated = await response.json();
      setReceipt(updated);
      setItems(updated.items || []);
      setIsEditing(false);
      toast.success("Receipt updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setReceipt(initialReceipt);
    setItems(initialReceipt.items || []);
    setIsEditing(false);
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `temp-${Date.now()}`,
      receiptId: receipt.id,
      rawName: "",
      quantity: 1,
      unitPrice: null,
      totalPrice: 0,
      normalizedItemId: null,
      category: null,
      lineNumber: items.length + 1,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems([...items, newItem]);
  };

  const handleDeleteItem = (index: number) => {
    setItemToDelete(index);
    setShowDeleteItemDialog(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete !== null) {
      setItems(items.filter((_, i) => i !== itemToDelete));
      setItemToDelete(null);
    }
    setShowDeleteItemDialog(false);
  };

  const handleReparse = async () => {
    setIsReparsing(true);
    try {
      const response = await fetch(`/api/receipts/${receipt.id}/reparse`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to re-parse receipt");
      }

      toast.success("Receipt re-parsed successfully");
      router.refresh();
    } catch (error) {
      console.error("Re-parse error:", error);
      toast.error("Failed to re-parse receipt");
    } finally {
      setIsReparsing(false);
      setShowReparseDialog(false);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof ReceiptItem,
    value: any
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Receipt Details</CardTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    onClick={() => setShowReparseDialog(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Re-parse
                  </Button>
                  <Button onClick={() => setIsEditing(true)}>Edit</Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={receipt.storeName}
                onChange={(e) =>
                  setReceipt({ ...receipt, storeName: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={receipt.purchaseDate}
                onChange={(e) =>
                  setReceipt({ ...receipt, purchaseDate: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="subtotal">Subtotal</Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                value={receipt.subtotal ?? ""}
                onChange={(e) =>
                  setReceipt({
                    ...receipt,
                    subtotal: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="tax">Tax</Label>
              <Input
                id="tax"
                type="number"
                step="0.01"
                value={receipt.tax ?? ""}
                onChange={(e) =>
                  setReceipt({
                    ...receipt,
                    tax: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                value={receipt.total}
                onChange={(e) =>
                  setReceipt({
                    ...receipt,
                    total: parseFloat(e.target.value) || 0,
                  })
                }
                disabled={!isEditing}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={receipt.notes ?? ""}
                onChange={(e) =>
                  setReceipt({
                    ...receipt,
                    notes: e.target.value || null,
                  })
                }
                disabled={!isEditing}
                placeholder="Add any notes about this receipt..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            {isEditing && (
              <Button onClick={handleAddItem} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Item Name</TableHead>
                <TableHead className="w-40">Category</TableHead>
                <TableHead className="w-24">Qty</TableHead>
                <TableHead className="w-28">Unit Price</TableHead>
                <TableHead className="w-28">Total</TableHead>
                <TableHead className="min-w-[120px]">Notes</TableHead>
                {isEditing && <TableHead className="w-16"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={item.rawName}
                        onChange={(e) =>
                          handleItemChange(index, "rawName", e.target.value)
                        }
                        placeholder="Item name"
                      />
                    ) : (
                      item.rawName
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select
                        value={item.category || "Other"}
                        onValueChange={(value) =>
                          handleItemChange(index, "category", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">{item.category || "Other"}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            parseFloat(e.target.value) || 1
                          )
                        }
                      />
                    ) : (
                      item.quantity
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice ?? ""}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "unitPrice",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="0.00"
                      />
                    ) : item.unitPrice ? (
                      `$${item.unitPrice.toFixed(2)}`
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={item.totalPrice}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "totalPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    ) : (
                      `$${item.totalPrice.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={item.notes ?? ""}
                        onChange={(e) =>
                          handleItemChange(index, "notes", e.target.value || null)
                        }
                        placeholder="Notes..."
                      />
                    ) : (
                      item.notes || "-"
                    )}
                  </TableCell>
                  {isEditing && (
                    <TableCell>
                      <Button
                        onClick={() => handleDeleteItem(index)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Re-parse Confirmation Dialog */}
      <AlertDialog
        open={showReparseDialog}
        onOpenChange={setShowReparseDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-parse Receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all current line items and re-extract data from
              the receipt image using AI. Any manual edits will be lost. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReparse}
              disabled={isReparsing}
            >
              {isReparsing ? "Re-parsing..." : "Re-parse"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirmation Dialog */}
      <AlertDialog
        open={showDeleteItemDialog}
        onOpenChange={setShowDeleteItemDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this item from the receipt. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
