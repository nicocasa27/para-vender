
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Dummy data for the table
const recentSales = [
  {
    id: 1,
    customer: "John Doe",
    customerInitial: "JD",
    product: "iPhone 13 Pro",
    date: "2023-05-15",
    amount: 1299.99,
    status: "completed",
    store: "Downtown Store",
  },
  {
    id: 2,
    customer: "Jane Smith",
    customerInitial: "JS",
    product: "MacBook Air",
    date: "2023-05-14",
    amount: 999.99,
    status: "completed",
    store: "Mall Store",
  },
  {
    id: 3,
    customer: "Robert Johnson",
    customerInitial: "RJ",
    product: "AirPods Pro",
    date: "2023-05-14",
    amount: 249.99,
    status: "completed",
    store: "Downtown Store",
  },
  {
    id: 4,
    customer: "Emily Wilson",
    customerInitial: "EW",
    product: "iPad Air",
    date: "2023-05-13",
    amount: 599.99,
    status: "pending",
    store: "Online",
  },
  {
    id: 5,
    customer: "Michael Brown",
    customerInitial: "MB",
    product: "Apple Watch",
    date: "2023-05-12",
    amount: 399.99,
    status: "completed",
    store: "Mall Store",
  },
];

export const RecentSalesTable = () => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(recentSales.length / 5);

  return (
    <Card className="transition-all duration-300 hover:shadow-elevation">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Recent Sales</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.map((sale) => (
                <TableRow key={sale.id} className="animate-fade-in">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {sale.customerInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{sale.customer}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{sale.product}</span>
                      <span className="text-xs text-muted-foreground">
                        {sale.store}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(sale.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${sale.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sale.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {sale.status}
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
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Print receipt</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground mx-2">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
