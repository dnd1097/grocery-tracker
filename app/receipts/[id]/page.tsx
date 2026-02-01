import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Receipt } from "@/types/receipt";
import { ReceiptEditor } from "@/components/receipts/ReceiptEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getReceipt(id: string): Promise<Receipt | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/receipts/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return null;
  }
}

export default async function ReceiptDetailPage({ params }: PageProps) {
  const { id } = await params;
  const receipt = await getReceipt(id);

  if (!receipt) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/receipts">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Receipts
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Receipt Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardContent className="p-4">
              <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                {receipt.imagePath ? (
                  <Image
                    src={receipt.imagePath}
                    alt={`Receipt from ${receipt.storeName}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <ReceiptEditor receipt={receipt} />
        </div>
      </div>
    </div>
  );
}
