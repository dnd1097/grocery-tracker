import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt as ReceiptIcon, Upload, TrendingUp, Calendar } from "lucide-react";
import { Receipt } from "@/types/receipt";

async function getStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/receipts`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return { receipts: [], totalSpent: 0, thisMonth: 0, receiptCount: 0 };
    }

    const data = await response.json();
    const receipts: Receipt[] = data.receipts || [];

    const totalSpent = receipts.reduce((sum, r) => sum + r.total, 0);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const thisMonthReceipts = receipts.filter(
      (r) => r.purchaseDate >= thisMonthStart
    );
    const thisMonth = thisMonthReceipts.reduce((sum, r) => sum + r.total, 0);

    return {
      receipts,
      totalSpent,
      thisMonth,
      receiptCount: receipts.length,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { receipts: [], totalSpent: 0, thisMonth: 0, receiptCount: 0 };
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome to GroceryIQ</h1>
        <p className="text-lg text-muted-foreground">
          Track your grocery spending with AI-powered receipt scanning
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.receiptCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
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
            <p className="text-xs text-muted-foreground mt-1">
              Current month spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Upload Your First Receipt</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Take a photo of your grocery receipt and let AI extract all the details
            automatically. Edit as needed and track your spending over time.
          </p>
          <Link href="/receipts">
            <Button size="lg">Go to Receipts</Button>
          </Link>
        </CardContent>
      </Card>

      {stats.receipts.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Receipts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.receipts.slice(0, 4).map((receipt) => (
              <Link key={receipt.id} href={`/receipts/${receipt.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{receipt.storeName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(receipt.purchaseDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${receipt.total.toFixed(2)}</p>
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
      )}
    </div>
  );
}
