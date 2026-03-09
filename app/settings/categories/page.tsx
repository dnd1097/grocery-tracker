import { Suspense } from "react";
import { db } from "@/lib/db";
import { customCategories } from "@/lib/db/schema";
import { CategoriesManager } from "@/components/settings/CategoriesManager";
import { DEFAULT_GROCERY_CATEGORIES } from "@/lib/utils/categories";

export const metadata = {
  title: "Category Settings | Grocery Tracker",
  description: "Manage your grocery categories",
};

async function getCustomCategories() {
  const categories = await db
    .select()
    .from(customCategories)
    .orderBy(customCategories.name);

  return categories;
}

export default async function CategoriesPage() {
  const customCats = await getCustomCategories();

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Category Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your grocery categories. You can add custom categories in addition to the default ones.
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <CategoriesManager
            defaultCategories={Array.from(DEFAULT_GROCERY_CATEGORIES)}
            customCategories={customCats}
          />
        </Suspense>
      </div>
    </div>
  );
}
