import { TopItem } from "@/lib/utils/analytics";
import { Badge } from "@/components/ui/badge";

interface TopItemsListProps {
  items: TopItem[];
}

export function TopItemsList({ items }: TopItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.itemName}
          className="flex items-center justify-between p-3 rounded-lg border"
        >
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="w-8 h-8 rounded-full flex items-center justify-center"
            >
              {index + 1}
            </Badge>
            <div>
              <div className="font-medium capitalize">{item.itemName}</div>
              <div className="text-xs text-muted-foreground">
                {item.purchaseCount} purchase{item.purchaseCount !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              ${item.totalSpent.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              ${item.avgPrice.toFixed(2)} avg
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
