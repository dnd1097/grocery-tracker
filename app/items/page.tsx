import { ItemsView } from "@/components/items/ItemsView";

async function getItems() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/items`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch items");
      return { items: [] };
    }

    const data = await response.json();
    return { items: data.items || [] };
  } catch (error) {
    console.error("Error fetching items:", error);
    return { items: [] };
  }
}

async function getFilterOptions() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/items?filters=true`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return { vendors: [], categories: [] };
    }

    const data = await response.json();
    return {
      vendors: data.vendors || [],
      categories: data.categories || [],
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return { vendors: [], categories: [] };
  }
}

export default async function ItemsPage() {
  const [{ items }, { vendors, categories }] = await Promise.all([
    getItems(),
    getFilterOptions(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Item History</h1>
        <p className="text-muted-foreground">
          View purchase history and price trends for all your grocery items
        </p>
      </div>

      <ItemsView
        initialItems={items}
        vendors={vendors}
        categories={categories}
      />
    </div>
  );
}
