"use client";

import { Receipt } from "@/types/receipt";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, DollarSign, Store, Trash2, AlertCircle, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

interface ReceiptsListProps {
  receipts: Receipt[];
}

export function ReceiptsList({ receipts }: ReceiptsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (receiptId: string) => {
    setDeletingId(receiptId);
    try {
      const response = await fetch(`/api/receipts/${receiptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete receipt");
      }

      toast.success("Receipt deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete receipt");
      setDeletingId(null);
    }
  };

  if (receipts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No receipts yet. Upload your first receipt to get started!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Accordion type="single" collapsible className="space-y-4">
          {receipts.map((receipt) => {
            const itemCount = receipt.items?.length || 0;
            const hasError = !!receipt.parsingError;

            return (
              <AccordionItem
                key={receipt.id}
                value={receipt.id}
                className="border rounded-lg overflow-hidden"
              >
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-4 w-full">
                      {/* Thumbnail */}
                      <div className="relative w-16 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
                        {receipt.thumbnailPath ? (
                          <Image
                            src={receipt.thumbnailPath}
                            alt={`Receipt from ${receipt.storeName}`}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Receipt Info */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {receipt.storeName}
                          </h3>
                          {receipt.manuallyEdited && (
                            <Badge variant="secondary" className="text-xs">
                              Edited
                            </Badge>
                          )}
                          {hasError && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              Parse Error
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(receipt.purchaseDate), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium text-foreground">
                              ${receipt.total.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span>
                              {itemCount} {itemCount === 1 ? "item" : "items"}
                            </span>
                          </div>
                        </div>
                        {hasError && (
                          <div className="mt-1 text-xs text-destructive">
                            {receipt.parsingError}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link href={`/receipts/${receipt.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialogId(receipt.id);
                          }}
                          disabled={deletingId === receipt.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    {itemCount === 0 ? (
                      <p className="text-sm text-muted-foreground">No items found.</p>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm mb-3">Line Items</h4>
                        <div className="space-y-1">
                          {receipt.items?.map((item, index) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-2 px-3 rounded bg-muted/50 text-sm"
                            >
                              <div className="flex-1">
                                <span className="font-medium">{item.rawName}</span>
                                {item.notes && (
                                  <span className="ml-2 text-xs text-muted-foreground italic">
                                    ({item.notes})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-muted-foreground">
                                <span>Qty: {item.quantity}</span>
                                {item.unitPrice && (
                                  <span>@ ${item.unitPrice.toFixed(2)}</span>
                                )}
                                <span className="font-medium text-foreground min-w-[4rem] text-right">
                                  ${item.totalPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogId !== null}
        onOpenChange={(open) => !open && setDeleteDialogId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the receipt and all its items. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialogId) {
                  handleDelete(deleteDialogId);
                  setDeleteDialogId(null);
                }
              }}
              disabled={deletingId !== null}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deletingId !== null ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
