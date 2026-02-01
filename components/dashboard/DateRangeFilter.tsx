"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

export type DateRange =
  | "this-month"
  | "last-3-months"
  | "last-6-months"
  | "this-year"
  | "all-time";

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange =
    (searchParams.get("range") as DateRange) || "this-month";

  const handleRangeChange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams);
    params.set("range", range);
    router.push(`/?${params.toString()}`);
  };

  return (
    <Select value={currentRange} onValueChange={handleRangeChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select date range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="this-month">This Month</SelectItem>
        <SelectItem value="last-3-months">Last 3 Months</SelectItem>
        <SelectItem value="last-6-months">Last 6 Months</SelectItem>
        <SelectItem value="this-year">This Year</SelectItem>
        <SelectItem value="all-time">All Time</SelectItem>
      </SelectContent>
    </Select>
  );
}
