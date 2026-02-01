import { ShoppingListManager } from "@/components/shopping-list/ShoppingListManager";

export default function ShoppingListPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shopping Lists</h1>
        <p className="text-muted-foreground">
          Create shopping lists and get AI-powered predictions based on your
          purchase history
        </p>
      </div>

      <ShoppingListManager />
    </div>
  );
}
