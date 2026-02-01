"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Sparkles, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PredictedItem } from "@/lib/utils/shopping-predictions";
import { ShoppingList } from "@/lib/db/schema";

export function ShoppingListManager() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [predictions, setPredictions] = useState<PredictedItem[]>([]);
  const [selectedPredictions, setSelectedPredictions] = useState<Set<string>>(
    new Set()
  );
  const [showPredictionDialog, setShowPredictionDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch("/api/shopping-lists");
      const data = await response.json();
      setLists(data.lists || []);
    } catch (error) {
      console.error("Failed to fetch lists:", error);
      toast.error("Failed to load shopping lists");
    }
  };

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/shopping-lists/predictions");
      const data = await response.json();
      setPredictions(data.predictions || []);
      setSelectedPredictions(
        new Set(data.predictions.map((p: PredictedItem) => p.itemName))
      );
      setShowPredictionDialog(true);
    } catch (error) {
      console.error("Failed to fetch predictions:", error);
      toast.error("Failed to generate predictions");
    } finally {
      setIsLoading(false);
    }
  };

  const createListFromPredictions = async () => {
    const selectedItems = predictions.filter((p) =>
      selectedPredictions.has(p.itemName)
    );

    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    const listName =
      newListName ||
      `Shopping List - ${new Date().toLocaleDateString()}`;

    setIsLoading(true);
    try {
      const response = await fetch("/api/shopping-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: listName,
          items: selectedItems.map((item) => ({
            itemName: item.itemName,
            category: item.category,
            quantity: item.suggestedQuantity,
            estimatedPrice: item.avgPrice,
            preferredVendor: item.preferredVendor,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to create list");

      toast.success("Shopping list created");
      setShowPredictionDialog(false);
      setNewListName("");
      fetchLists();
    } catch (error) {
      console.error("Failed to create list:", error);
      toast.error("Failed to create shopping list");
    } finally {
      setIsLoading(false);
    }
  };

  const createEmptyList = async () => {
    if (!newListName.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/shopping-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          items: [],
        }),
      });

      if (!response.ok) throw new Error("Failed to create list");

      toast.success("Shopping list created");
      setShowCreateDialog(false);
      setNewListName("");
      fetchLists();
    } catch (error) {
      console.error("Failed to create list:", error);
      toast.error("Failed to create shopping list");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteList = async (id: string) => {
    if (!confirm("Are you sure you want to delete this list?")) return;

    try {
      const response = await fetch(`/api/shopping-lists/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete list");

      toast.success("List deleted");
      fetchLists();
    } catch (error) {
      console.error("Failed to delete list:", error);
      toast.error("Failed to delete list");
    }
  };

  const markAsCompleted = async (list: ShoppingList) => {
    try {
      const response = await fetch(`/api/shopping-lists/${list.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list: {
            status: "completed",
            completedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to update list");

      toast.success("List marked as completed");
      fetchLists();
    } catch (error) {
      console.error("Failed to update list:", error);
      toast.error("Failed to update list");
    }
  };

  const togglePrediction = (itemName: string) => {
    const newSelected = new Set(selectedPredictions);
    if (newSelected.has(itemName)) {
      newSelected.delete(itemName);
    } else {
      newSelected.add(itemName);
    }
    setSelectedPredictions(newSelected);
  };

  const activeLists = lists.filter((l) => l.status === "active");
  const completedLists = lists.filter((l) => l.status === "completed");

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={fetchPredictions}
          disabled={isLoading}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generate Predicted List
        </Button>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Shopping List</DialogTitle>
              <DialogDescription>
                Create an empty list to add items manually
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="List name (e.g., Weekly Groceries)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              <Button
                onClick={createEmptyList}
                disabled={isLoading}
                className="w-full"
              >
                Create List
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Prediction Dialog */}
      <Dialog
        open={showPredictionDialog}
        onOpenChange={setShowPredictionDialog}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Predicted Shopping List</DialogTitle>
            <DialogDescription>
              Based on your purchase history, these items may need restocking
              soon
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="List name (optional)"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
            {predictions.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Est. Price</TableHead>
                      <TableHead>Vendor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions.map((item) => (
                      <TableRow key={item.itemName}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPredictions.has(item.itemName)}
                            onCheckedChange={() =>
                              togglePrediction(item.itemName)
                            }
                          />
                        </TableCell>
                        <TableCell className="capitalize">
                          {item.itemName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {item.category || "Other"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.suggestedQuantity}</TableCell>
                        <TableCell>${item.avgPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.preferredVendor}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button
                  onClick={createListFromPredictions}
                  disabled={isLoading || selectedPredictions.size === 0}
                  className="w-full"
                >
                  Create List ({selectedPredictions.size} items)
                </Button>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No predictions available. Upload more receipts to build purchase
                patterns.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Lists */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Active Lists</h2>
        {activeLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeLists.map((list) => (
              <Card key={list.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{list.name}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsCompleted(list)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteList(list.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {(list as any).items?.length || 0} items
                    </div>
                    {list.estimatedTotal && list.estimatedTotal > 0 && (
                      <div className="font-semibold">
                        Est. ${list.estimatedTotal.toFixed(2)}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(list.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No active lists. Create one to get started!
          </p>
        )}
      </div>

      {/* Completed Lists */}
      {completedLists.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Completed Lists</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedLists.map((list) => (
              <Card key={list.id} className="opacity-75">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{list.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteList(list.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="outline">Completed</Badge>
                    <div className="text-sm text-muted-foreground">
                      {(list as any).items?.length || 0} items
                    </div>
                    {list.completedAt && (
                      <div className="text-xs text-muted-foreground">
                        Completed{" "}
                        {new Date(list.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
