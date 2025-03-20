
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  MoreHorizontal, 
  Search,
  Package,
  Filter,
  Plus,
  Edit,
  Trash,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { Card } from "@/components/ui/card";

// Dummy data for the table
const products = [
  {
    id: 1,
    name: "iPhone 13 Pro",
    category: "Electronics",
    unit: "Unit",
    purchasePrice: 899.99,
    salePrice: 1299.99,
    stock: {
      "Downtown Store": 15,
      "Mall Store": 8,
      "Online Warehouse": 23,
    },
    minStock: 5,
    maxStock: 30,
  },
  {
    id: 2,
    name: "MacBook Air",
    category: "Electronics",
    unit: "Unit",
    purchasePrice: 799.99,
    salePrice: 999.99,
    stock: {
      "Downtown Store": 7,
      "Mall Store": 4,
      "Online Warehouse": 12,
    },
    minStock: 3,
    maxStock: 20,
  },
  {
    id: 3,
    name: "AirPods Pro",
    category: "Electronics",
    unit: "Unit",
    purchasePrice: 179.99,
    salePrice: 249.99,
    stock: {
      "Downtown Store": 3,
      "Mall Store": 10,
      "Online Warehouse": 25,
    },
    minStock: 10,
    maxStock: 50,
  },
  {
    id: 4,
    name: "iPad Air",
    category: "Electronics",
    unit: "Unit",
    purchasePrice: 499.99,
    salePrice: 599.99,
    stock: {
      "Downtown Store": 6,
      "Mall Store": 9,
      "Online Warehouse": 14,
    },
    minStock: 5,
    maxStock: 25,
  },
  {
    id: 5,
    name: "Apple Watch",
    category: "Electronics",
    unit: "Unit",
    purchasePrice: 299.99,
    salePrice: 399.99,
    stock: {
      "Downtown Store": 11,
      "Mall Store": 7,
      "Online Warehouse": 18,
    },
    minStock: 5,
    maxStock: 30,
  },
];

// Dummy data for categories
const categories = [
  { id: "all", name: "All Categories" },
  { id: "electronics", name: "Electronics" },
  { id: "clothing", name: "Clothing" },
  { id: "food", name: "Food & Beverages" },
  { id: "furniture", name: "Furniture" },
  { id: "other", name: "Other" },
];

// Dummy data for stores
const stores = [
  { id: "all", name: "All Stores" },
  { id: "downtown", name: "Downtown Store" },
  { id: "mall", name: "Mall Store" },
  { id: "online", name: "Online Warehouse" },
];

export const ProductTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStore, setSelectedStore] = useState("all");
  const [page, setPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const getTotalStock = (product: typeof products[0]) => {
    return Object.values(product.stock).reduce((acc, curr) => acc + curr, 0);
  };

  const getStockStatus = (product: typeof products[0]) => {
    const totalStock = getTotalStock(product);
    if (totalStock <= product.minStock) return "low";
    if (totalStock >= product.maxStock) return "high";
    return "normal";
  };

  // Filter products based on search, category, and store
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      product.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStore =
      selectedStore === "all" ||
      product.stock[
        stores.find((store) => store.id === selectedStore)?.name || ""
      ] !== undefined;
    return matchesSearch && matchesCategory && matchesStore;
  });

  // Paginate products
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-36">
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
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="flex-shrink-0">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Advanced filters</span>
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <FileText className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-shrink-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Fill in the product details. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <ProductForm
                  onSubmit={(data) => {
                    console.log(data);
                    setIsAddDialogOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id} className="animate-fade-in">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div className="font-medium">{product.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>${product.salePrice.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          Cost: ${product.purchasePrice.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {getTotalStock(product)} {product.unit}s
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Across {Object.keys(product.stock).length} stores
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          getStockStatus(product) === "low"
                            ? "destructive"
                            : getStockStatus(product) === "high"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {getStockStatus(product) === "low"
                          ? "Low Stock"
                          : getStockStatus(product) === "high"
                          ? "Overstocked"
                          : "Normal"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Package className="h-10 w-10 mb-2" />
                      <p className="text-base">No products found</p>
                      <p className="text-sm">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(filteredProducts.length, page * itemsPerPage) - ((page - 1) * itemsPerPage)} of{" "}
            {filteredProducts.length} products
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page} of {Math.max(1, totalPages)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
