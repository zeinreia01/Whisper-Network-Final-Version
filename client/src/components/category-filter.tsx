import { categories } from "@/lib/categories";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="bg-card rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Filter by Category</h2>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onCategoryChange("all")}
          className={`flex items-center px-4 py-2 rounded-full transition-colors ${
            activeCategory === "all"
              ? "bg-secondary text-secondary-foreground"
              : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          <span className="category-dot bg-gray-400"></span>
          All Messages
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center px-4 py-2 rounded-full transition-colors ${
              activeCategory === category.id
                ? `bg-${category.color}/20 text-${category.color}`
                : `bg-${category.color}/10 text-${category.color} hover:bg-${category.color}/20`
            }`}
          >
            <span className={`category-dot ${category.color}`}></span>
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
