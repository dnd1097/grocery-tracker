import { ReceiptCard } from "@/components/receipts/ReceiptCard";
import { ReceiptUpload } from "@/components/receipts/ReceiptUpload";
import { ReceiptsList } from "@/components/receipts/ReceiptsList";
import { ReceiptsViewToggle } from "@/components/receipts/ReceiptsViewToggle";
import { Receipt } from "@/types/receipt";

async function getReceipts(): Promise<Receipt[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/receipts`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch receipts");
    }

    const data = await response.json();
    return data.receipts || [];
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const receipts = await getReceipts();
  const params = await searchParams;
  const view = params.view || "grid";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Receipts</h1>
        <p className="text-muted-foreground">
          Upload and manage your grocery receipts
        </p>
      </div>

      <div className="mb-8">
        <ReceiptUpload />
      </div>

      {receipts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            No receipts yet. Upload your first receipt to get started!
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                All Receipts ({receipts.length})
              </h2>
              <ReceiptsViewToggle />
            </div>
          </div>

          {view === "list" ? (
            <ReceiptsList receipts={receipts} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {receipts.map((receipt) => (
                <ReceiptCard key={receipt.id} receipt={receipt} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
