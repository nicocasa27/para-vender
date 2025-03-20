
import { useState } from "react";
import { Search, Filter, ShoppingCart, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Dummy data for products
const products = [
  {
    id: 1,
    name: "iPhone 13 Pro",
    category: "Electronics",
    price: 1299.99,
    stock: 15,
    image: "/placeholder.svg",
  },
  {
    id: 2,
    name: "MacBook Air",
    category: "Electronics",
    price: 999.99,
    stock: 7,
    image: "/placeholder.svg",
  },
  {
    id: 3,
    name: "AirPods Pro",
    category: "Electronics",
    price: 249.99,
    stock: 3,
    image: "/placeholder.svg",
  },
  {
    id: 4,
    name: "iPad Air",
    category: "Electronics",
    price: 599.99,
    stock: 6,
    image: "/placeholder.svg",
  },
  {
    id: 5,
    name: "Apple Watch",
    category: "Electronics",
    price: 399.99,
    stock: 11,
    image: "/placeholder.svg",
  },
  {
    id: 6,
    name: "T-Shirt",
    category: "Clothing",
    price: 19.99,
    stock: 25,
    image: "/placeholder.svg",
  },
  {
    id: 7,
    name: "Jeans",
    category: "Clothing",
    price: 49.99,
    stock: 18,
    image: "/placeholder.svg",
  },
  {
    id: 8,
    name: "Sneakers",
    category: "Clothing",
    price: 89.99,
    stock: 13,
    image: "/placeholder.svg",
  },
  {
    id: 9,
    name: "Water Bottle",
    category: "Food & Beverages",
    price: 1.99,
    stock: 50,
    image: "/placeholder.svg",
  },
  {
    id: 10,
    name: "Coffee Beans",
    category: "Food & Beverages",
    price: 12.99,
    stock: 32,
    image: "/placeholder.svg",
  },
];

// Categories
const categories = [
  { id: "all", name: "All" },
  { id: "electronics", name: "Electronics" },
  { id: "clothing", name: "Clothing" },
  { id: "food", name: "Food & Beverages" },
];

interface ProductGridProps {
  onProductSelect: (product: typeof products[0]) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ onProductSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      product.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="bg-card rounded-lg p-4 shadow-sm">
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs 
            defaultValue="grid" 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as "grid" | "list")}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-auto pb-4">
        {filteredProducts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Package className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">Try a different search term or category</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  product.stock <= 0 && "opacity-60"
                )}
                onClick={() => product.stock > 0 && onProductSelect(product)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-cover w-full h-full rounded-t-lg"
                    />
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-t-lg">
                        <span className="text-white font-semibold">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="mt-1 flex justify-between items-center">
                      <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                      <Badge variant="outline">
                        Stock: {product.stock}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "flex items-center p-3 rounded-lg border cursor-pointer hover:bg-accent/20 transition-colors",
                  product.stock <= 0 && "opacity-60"
                )}
                onClick={() => product.stock > 0 && onProductSelect(product)}
              >
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover w-full h-full rounded-md"
                  />
                </div>
                <div className="flex-1 mr-4">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">{product.category}</div>
                </div>
                <div className="flex items-center">
                  <div className="font-bold mr-4">${product.price.toFixed(2)}</div>
                  <Badge variant={product.stock <= 0 ? "destructive" : "outline"}>
                    {product.stock <= 0 ? "Out of stock" : `${product.stock} left`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
