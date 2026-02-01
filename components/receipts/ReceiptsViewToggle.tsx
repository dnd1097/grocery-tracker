"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Grid3x3, List } from "lucide-react";

export function ReceiptsViewToggle() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const view = searchParams.get("view") || "grid";

  const setView = (newView: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-1 border rounded-md p-1">
      <Button
        variant={view === "grid" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setView("grid")}
        className="gap-2"
      >
        <Grid3x3 className="h-4 w-4" />
        Grid
      </Button>
      <Button
        variant={view === "list" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setView("list")}
        className="gap-2"
      >
        <List className="h-4 w-4" />
        List
      </Button>
    </div>
  );
}
