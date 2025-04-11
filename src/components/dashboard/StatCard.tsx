
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: number;
  isLoading?: boolean;
}

export const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  isLoading = false,
}: StatCardProps) => {
  const getTrendColor = (trend?: number) => {
    if (trend === undefined) return "text-muted-foreground";
    return trend >= 0 ? "text-green-600" : "text-red-600";
  };

  const getTrendIcon = (trend?: number) => {
    if (trend === undefined) return null;
    return trend >= 0 ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className="text-3xl font-bold tracking-tight">{value}</p>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        
        {description && (
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-4 w-28" />
            ) : (
              <div className={`flex items-center text-sm ${getTrendColor(trend)}`}>
                {getTrendIcon(trend)}
                <span className="ml-1">{description}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
