"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SpendingByCategory } from "@/lib/utils/analytics";

interface CategorySpendingChartProps {
  data: SpendingByCategory[];
}

export function CategorySpendingChart({
  data,
}: CategorySpendingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis
          dataKey="category"
          type="category"
          width={100}
          fontSize={12}
        />
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
        <Bar dataKey="total" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
