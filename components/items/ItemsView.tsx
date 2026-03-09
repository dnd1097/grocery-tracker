"use client";

import { useState, useMemo } from "react";
import {
  AggregatedItem,
  ItemPurchaseInstance,
} from "@/lib/utils/item-aggregation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ItemsViewProps {
  initialItems: AggregatedItem[];
  vendors: string[];
  categories: string[];
}

type SortField = "name" | "frequency" | "lastPurchased" | "avgPrice";

export function ItemsView({
  initialItems,
  vendors,
  categories,
}: ItemsViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortField>("lastPurchased");
  const [purchaseHistory, setPurchaseHistory] = useState<
    Record<string, ItemPurchaseInstance[]>
  >({});

  // Multi-select and bulk actions
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<string>("");

  // Alternate names editing
  const [editingAlternates, setEditingAlternates] = useState<
    Record<string, boolean>
  >({});
  const [alternateNamesInput, setAlternateNamesInput] = useState<
    Record<string, string>
  >({});

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = initialItems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.normalizedName.includes(searchTerm.toLowerCase())
      );
    }

    // Vendor filter
    if (selectedVendor !== "all") {
      filtered = filtered.filter((item) =>
        item.vendors.includes(selectedVendor)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (item) => item.category === selectedCategory
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case "name":
        sorted.sort((a, b) =>
          a.normalizedName.localeCompare(b.normalizedName)
        );
        break;
      case "frequency":
        sorted.sort((a, b) => b.purchaseCount - a.purchaseCount);
        break;
      case "lastPurchased":
        sorted.sort((a, b) =>
          b.lastPurchaseDate.localeCompare(a.lastPurchaseDate)
        );
        break;
      case "avgPrice":
        sorted.sort((a, b) => b.avgPrice - a.avgPrice);
        break;
    }

    return sorted;
  }, [
    initialItems,
    searchTerm,
    selectedVendor,
    selectedCategory,
    sortBy,
  ]);

  const fetchPurchaseHistory = async (itemName: string) => {
    if (purchaseHistory[itemName]) return;

    try {
      const response = await fetch(
        `/api/items?itemName=${encodeURIComponent(itemName)}`
      );
      const data = await response.json();
      setPurchaseHistory((prev) => ({ ...prev, [itemName]: data.history }));
    } catch (error) {
      console.error("Failed to fetch purchase history:", error);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleBulkCategoryUpdate = async () => {
    if (!bulkCategory) {
      toast.error("Please select a category");
      return;
    }

    try {
      const response = await fetch("/api/items/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: Array.from(selectedItems),
          category: bulkCategory,
        }),
      });

      if (!response.ok) throw new Error("Failed to update items");

      toast.success(`Updated ${selectedItems.size} items`);
      setSelectedItems(new Set());
      setBulkCategoryDialogOpen(false);
      setBulkCategory("");
      router.refresh();
    } catch (error) {
      console.error("Bulk update error:", error);
      toast.error("Failed to update categories");
    }
  };

  const handleCategoryChange = async (itemId: string, category: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });

      if (!response.ok) throw new Error("Failed to update category");

      toast.success("Category updated");
      router.refresh();
    } catch (error) {
      console.error("Category update error:", error);
      toast.error("Failed to update category");
    }
  };

  const handleSaveAlternateNames = async (itemId: string) => {
    try {
      const alternateNames = alternateNamesInput[itemId] || "";

      const response = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alternateNames }),
      });

      if (!response.ok) throw new Error("Failed to update alternate names");

      toast.success("Alternate names saved");
      setEditingAlternates({ ...editingAlternates, [itemId]: false });
      router.refresh();
    } catch (error) {
      console.error("Alternate names update error:", error);
      toast.error("Failed to save alternate names");
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Actions Toolbar */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={() => setBulkCategoryDialogOpen(true)}
          >
            Set Category
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedItems(new Set())}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedVendor} onValueChange={setSelectedVendor}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor} value={vendor}>
                {vendor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SortField)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="frequency">Purchase Frequency</SelectItem>
            <SelectItem value="lastPurchased">Last Purchased</SelectItem>
            <SelectItem value="avgPrice">Average Price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items List */}
      <div className="border rounded-lg">
        {filteredItems.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredItems.map((item) => (
              <AccordionItem key={item.itemId} value={item.itemId}>
                <div className="flex items-center gap-3 px-6 hover:bg-muted/50">
                  <Checkbox
                    checked={selectedItems.has(item.itemId)}
                    onCheckedChange={() => toggleItemSelection(item.itemId)}
                  />
                  <AccordionTrigger
                    className="flex-1 py-4"
                    onClick={() => fetchPurchaseHistory(item.normalizedName)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full text-left pr-4">
                      <div className="md:col-span-2">
                        <div className="font-medium capitalize">
                          {item.displayName || item.normalizedName}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          {item.category || "Other"}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Purchases
                        </div>
                        <div className="font-medium">
                          {item.purchaseCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Last Purchased
                        </div>
                        <div className="font-medium">
                          {format(
                            new Date(item.lastPurchaseDate),
                            "MMM d, yyyy"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Avg Price
                        </div>
                        <div className="font-medium">
                          ${item.avgPrice.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${item.minPrice.toFixed(2)} - $
                          {item.maxPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                </div>
                <AccordionContent className="px-6 pb-4">
                  {purchaseHistory[item.normalizedName] ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3 text-sm">
                          Purchase History
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {purchaseHistory[item.normalizedName].map(
                              (purchase) => (
                                <TableRow key={purchase.id}>
                                  <TableCell>
                                    {format(
                                      new Date(purchase.purchaseDate),
                                      "MMM d, yyyy"
                                    )}
                                  </TableCell>
                                  <TableCell>{purchase.storeName}</TableCell>
                                  <TableCell>{purchase.quantity}</TableCell>
                                  <TableCell>
                                    ${purchase.totalPrice.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Alternate Names Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">
                            Alternate Names
                          </h4>
                          {!editingAlternates[item.itemId] && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditingAlternates({
                                  ...editingAlternates,
                                  [item.itemId]: true,
                                })
                              }
                            >
                              Edit
                            </Button>
                          )}
                        </div>

                        {editingAlternates[item.itemId] ? (
                          <div className="space-y-2">
                            <Input
                              value={
                                alternateNamesInput[item.itemId] ??
                                item.alternateNames ??
                                ""
                              }
                              onChange={(e) =>
                                setAlternateNamesInput({
                                  ...alternateNamesInput,
                                  [item.itemId]: e.target.value,
                                })
                              }
                              placeholder="milk, whole milk, 2% milk"
                            />
                            <p className="text-xs text-muted-foreground">
                              Separate alternate names with commas
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSaveAlternateNames(item.itemId)
                                }
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAlternates({
                                    ...editingAlternates,
                                    [item.itemId]: false,
                                  });
                                  // Reset input
                                  const newInput = { ...alternateNamesInput };
                                  delete newInput[item.itemId];
                                  setAlternateNamesInput(newInput);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {item.alternateNames ? (
                              item.alternateNames
                                .split(",")
                                .map((name, i) => (
                                  <Badge key={i} variant="outline">
                                    {name.trim()}
                                  </Badge>
                                ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No alternate names defined
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Category Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">Category</h4>
                            <p className="text-xs text-muted-foreground">
                              {item.categorySource === "manual"
                                ? "Manually set"
                                : "Auto-categorized"}
                            </p>
                          </div>
                          <Select
                            value={item.category || "Other"}
                            onValueChange={(value) =>
                              handleCategoryChange(item.itemId, value)
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Loading purchase history...
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No items found matching your filters.
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredItems.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredItems.length} item
          {filteredItems.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Bulk Category Dialog */}
      <Dialog
        open={bulkCategoryDialogOpen}
        onOpenChange={setBulkCategoryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Category</DialogTitle>
            <DialogDescription>
              Update category for {selectedItems.size} selected item
              {selectedItems.size !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={bulkCategory} onValueChange={setBulkCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkCategoryUpdate} className="w-full">
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
