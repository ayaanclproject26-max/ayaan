"use client";

import { CategoryCard } from "./CategoryHighlights";

// Data-driven list for future extensibility
const hotSalesCategories = [
  {
    id: "hot-sweaters",
    name: "SWEATERS",
    slug: "sweaters",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800",
    description: "Premium warm knitwear and stylish sweaters on sale."
  },
  {
    id: "hot-towels",
    name: "TOWELS",
    slug: "towels",
    image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&q=80&w=800",
    description: "Ultra-absorbent luxury bath and hand towels on special discount."
  }
];

export default function HotSales() {
  return (
    <section id="hot-sales" className="pb-10 sm:pb-12 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h2 className="text-fluid-h2 font-display uppercase tracking-tight">HOT SALES</h2>
        </div>
        
        {/* Hot Sales Categories (exact match to Shop by Category tile geometry, leaving remaining space empty) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {hotSalesCategories.map((category) => (
            <CategoryCard key={category.id} category={category} variant="primary" />
          ))}
        </div>
      </div>
    </section>
  );
}
