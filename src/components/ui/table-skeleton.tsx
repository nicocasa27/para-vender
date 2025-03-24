import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  hasWidths?: boolean;
  cellContent?: React.ReactNode[];
}

export function TableSkeleton({ 
  columns, 
  rows = 5, 
  hasWidths = true,
  cellContent 
}: TableSkeletonProps) {
  // Generate a set of reasonable widths for table columns
  const getWidths = () => {
    // Simple algorithm to create varied but consistent widths
    return Array(columns).fill(0).map((_, i) => {
      // Alternate between wider and narrower columns
      const base = (i % 2 === 0) ? 24 : 32;
      // Add some randomization but keep it consistent by using the index
      const width = base + ((i * 7) % 16);
      return width;
    });
  };

  const widths = hasWidths ? getWidths() : Array(columns).fill(24);

  return (
    <>
      {Array(rows).fill(0).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`} className="animate-pulse">
          {Array(columns).fill(0).map((_, colIndex) => (
            <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
              {cellContent && cellContent[colIndex] ? (
                cellContent[colIndex]
              ) : (
                <Skeleton className={`h-4 w-${widths[colIndex]}`} />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function ComplexTableSkeleton() {
  return (
    <>
      {Array(5).fill(0).map((_, i) => (
        <TableRow key={`complex-skeleton-${i}`}>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  colSpan = 4,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  colSpan?: number;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-60 text-center">
        <div className="flex flex-col items-center justify-center py-8">
          <Icon className="w-12 h-12 text-muted-foreground/60 mb-4" />
          <p className="text-lg font-medium">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}
