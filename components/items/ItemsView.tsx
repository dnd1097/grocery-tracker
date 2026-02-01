"use client";

import { useState, useMemo } from "react";
import {
  AggregatedItem,
  ItemPurchaseInstance,
} from "@/lib/utils/item-aggregation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortField>("lastPurchased");
  const [purchaseHistory, setPurchaseHistory] = useState<
    Record<string, ItemPurchaseInstance[]>
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

  return (
    <div className="space-y-6">
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
              <AccordionItem
                key={item.normalizedName}
                value={item.normalizedName}
              >
                <AccordionTrigger
                  className="px-6 hover:bg-muted/50"
                  onClick={() => fetchPurchaseHistory(item.normalizedName)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full text-left pr-4">
                    <div className="md:col-span-2">
                      <div className="font-medium capitalize">
                        {item.normalizedName}
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
                        {format(new Date(item.lastPurchaseDate), "MMM d, yyyy")}
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
                        ${item.minPrice.toFixed(2)} - ${item.maxPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  {purchaseHistory[item.normalizedName] ? (
                    <div className="mt-2">
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
    </div>
  );
}
