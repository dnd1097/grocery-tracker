"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { CustomCategory } from "@/lib/db/schema";

interface CategoriesManagerProps {
  defaultCategories: string[];
  customCategories: CustomCategory[];
}

export function CategoriesManager({
  defaultCategories,
  customCategories: initialCustomCategories,
}: CategoriesManagerProps) {
  const router = useRouter();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CustomCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add category");
      }

      toast.success("Category added successfully");
      setNewCategoryName("");
      router.refresh();
    } catch (error) {
      console.error("Add category error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add category");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/categories?id=${categoryToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      toast.success("Category deleted successfully");
      setCategoryToDelete(null);
      router.refresh();
    } catch (error) {
      console.error("Delete category error:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Default Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Default Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These are the built-in categories that come with the app.
          </p>
          <div className="flex flex-wrap gap-2">
            {defaultCategories.map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add your own custom categories to organize items your way.
          </p>

          {/* Add new category */}
          <div className="flex gap-2 mb-4">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddCategory();
                }
              }}
            />
            <Button
              onClick={handleAddCategory}
              disabled={isAdding || !newCategoryName.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {/* List of custom categories */}
          {initialCustomCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {initialCustomCategories.map((category) => (
                <Badge
                  key={category.id}
                  variant="default"
                  className="gap-2 pr-1"
                >
                  {category.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-destructive/20"
                    onClick={() => setCategoryToDelete(category)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No custom categories yet. Add one above to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"?
              This will not affect existing items already categorized with this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
