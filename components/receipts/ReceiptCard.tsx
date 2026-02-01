"use client";

import { Receipt } from "@/types/receipt";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, DollarSign, Trash2, AlertCircle } from "lucide-react";
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

interface ReceiptCardProps {
  receipt: Receipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const itemCount = receipt.items?.length || 0;
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/receipts/${receipt.id}`, {
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
      setIsDeleting(false);
    }
  };

  const hasError = !!receipt.parsingError;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group relative">
        <Link href={`/receipts/${receipt.id}`} className="block">
          <div className="relative aspect-[3/4] bg-muted">
            {receipt.thumbnailPath ? (
              <Image
                src={receipt.thumbnailPath}
                alt={`Receipt from ${receipt.storeName}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No image
              </div>
            )}
            {hasError && (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Parse Error
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg truncate flex-1">
                {receipt.storeName}
              </h3>
              {receipt.manuallyEdited && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Edited
                </Badge>
              )}
            </div>
            {hasError && (
              <div className="mb-2 text-xs text-destructive">
                <p className="truncate">{receipt.parsingError}</p>
              </div>
            )}
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(receipt.purchaseDate), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium text-foreground">
                  ${receipt.total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-4 py-3 bg-muted/50 text-xs text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </CardFooter>
        </Link>

        {/* Delete Button */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="destructive"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.preventDefault();
              setShowDeleteDialog(true);
            }}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the receipt from {receipt.storeName} and all {itemCount} items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
