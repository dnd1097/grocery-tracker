"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { SpendingByVendor } from "@/lib/utils/analytics";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
];

interface VendorSpendingChartProps {
  data: SpendingByVendor[];
}

export function VendorSpendingChart({ data }: VendorSpendingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="vendor"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(entry: any) =>
            `${entry.vendor}: $${entry.total.toFixed(0)}`
          }
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.vendor}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `$${Number(value).toFixed(2)}`}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
