
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon | React.ReactNode;
  description?: string;
  trend?: number;
  className?: string;
  isLoading?: boolean;
  periodText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className,
  isLoading = false,
  periodText = "vs. mes anterior",
}) => {
  return (
    <Card className={cn("overflow-hidden transition-all duration-300 hover:shadow-elevation", className)}>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex flex-col space-y-3 animate-pulse">
            <div className="h-4 w-1/2 bg-muted rounded"></div>
            <div className="h-8 w-1/3 bg-muted rounded"></div>
            <div className="h-3 w-2/3 bg-muted rounded"></div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
              {trend !== undefined && (
                <div className="flex items-center mt-2">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      trend > 0 ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    {trend > 0 ? "+" : ""}
                    {trend}%
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">{periodText}</span>
                </div>
              )}
            </div>
            <div className="rounded-full p-2 bg-primary/10 text-primary">
              {typeof icon === 'function' ? 
                icon({ className: "h-6 w-6" }) : 
                icon
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
