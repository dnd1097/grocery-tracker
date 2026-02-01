import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Receipt as ReceiptIcon,
  Upload,
  TrendingUp,
  Calendar,
  TrendingDown,
} from "lucide-react";
import { Receipt } from "@/types/receipt";
import {
  getSpendingByVendor,
  getSpendingByCategory,
  getMonthlySpending,
  getTopItems,
} from "@/lib/utils/analytics";
import { VendorSpendingChart } from "@/components/dashboard/VendorSpendingChart";
import { CategorySpendingChart } from "@/components/dashboard/CategorySpendingChart";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { TopItemsList } from "@/components/dashboard/TopItemsList";
import { DateRangeFilter, DateRange } from "@/components/dashboard/DateRangeFilter";

interface PageProps {
  searchParams: Promise<{ range?: DateRange }>;
}

function getDateRange(range: DateRange = "this-month") {
  const now = new Date();
  let dateFrom: string | undefined;
  let dateTo: string | undefined;

  switch (range) {
    case "this-month":
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      break;
    case "last-3-months":
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        .toISOString()
        .split("T")[0];
      break;
    case "last-6-months":
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        .toISOString()
        .split("T")[0];
      break;
    case "this-year":
      dateFrom = new Date(now.getFullYear(), 0, 1)
        .toISOString()
        .split("T")[0];
      break;
    case "all-time":
      dateFrom = undefined;
      break;
  }

  return { dateFrom, dateTo };
}

async function getStats(dateFrom?: string) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/receipts`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        receipts: [],
        totalSpent: 0,
        thisMonth: 0,
        lastMonth: 0,
        receiptCount: 0,
      };
    }

    const data = await response.json();
    const receipts: Receipt[] = data.receipts || [];

    // Total spent (all time or filtered)
    const filteredReceipts = dateFrom
      ? receipts.filter((r) => r.purchaseDate >= dateFrom)
      : receipts;
    const totalSpent = filteredReceipts.reduce((sum, r) => sum + r.total, 0);

    // This month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const thisMonthReceipts = receipts.filter(
      (r) => r.purchaseDate >= thisMonthStart
    );
    const thisMonth = thisMonthReceipts.reduce((sum, r) => sum + r.total, 0);

    // Last month (for comparison)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split("T")[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split("T")[0];
    const lastMonthReceipts = receipts.filter(
      (r) => r.purchaseDate >= lastMonthStart && r.purchaseDate <= lastMonthEnd
    );
    const lastMonth = lastMonthReceipts.reduce((sum, r) => sum + r.total, 0);

    return {
      receipts,
      totalSpent,
      thisMonth,
      lastMonth,
      receiptCount: filteredReceipts.length,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      receipts: [],
      totalSpent: 0,
      thisMonth: 0,
      lastMonth: 0,
      receiptCount: 0,
    };
  }
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = params.range || "this-month";
  const { dateFrom, dateTo } = getDateRange(range);

  const [stats, vendorData, categoryData, monthlyData, topItems] =
    await Promise.all([
      getStats(dateFrom),
      getSpendingByVendor(dateFrom, dateTo),
      getSpendingByCategory(dateFrom, dateTo),
      getMonthlySpending(dateFrom, dateTo),
      getTopItems(10, dateFrom, dateTo),
    ]);

  // Calculate month-over-month change
  const momChange = stats.thisMonth - stats.lastMonth;
  const momPercentage =
    stats.lastMonth > 0 ? (momChange / stats.lastMonth) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Track your grocery spending and analyze patterns
          </p>
        </div>
        <DateRangeFilter />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Receipts
            </CardTitle>
            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.receiptCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {range === "all-time" ? "All time" : "In selected period"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.thisMonth.toFixed(2)}
            </div>
            {stats.lastMonth > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {momChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-destructive" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-600" />
                )}
                <p
                  className={`text-xs ${
                    momChange >= 0 ? "text-destructive" : "text-green-600"
                  }`}
                >
                  {momChange >= 0 ? "+" : ""}
                  {momPercentage.toFixed(1)}% vs last month
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Spent
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {range === "all-time" ? "All time" : "In selected period"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {stats.receiptCount > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Vendor</CardTitle>
              </CardHeader>
              <CardContent>
                <VendorSpendingChart data={vendorData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <CategorySpendingChart data={categoryData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyTrendChart data={monthlyData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Purchased Items</CardTitle>
              </CardHeader>
              <CardContent>
                <TopItemsList items={topItems} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Receipts */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Recent Receipts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.receipts.slice(0, 4).map((receipt) => (
                <Link key={receipt.id} href={`/receipts/${receipt.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-2">
                        <div>
                          <h3 className="font-semibold">
                            {receipt.storeName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(
                              receipt.purchaseDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">
                            ${receipt.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {receipt.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <Card className="mb-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              Upload Your First Receipt
            </h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Take a photo of your grocery receipt and let AI extract all the
              details automatically. Edit as needed and track your spending
              over time.
            </p>
            <Link href="/receipts">
              <Button size="lg">Go to Receipts</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
