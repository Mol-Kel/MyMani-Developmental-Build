import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface BudgetCardSkeletonProps {
  count?: number;
}

export const BudgetCardSkeleton = ({ count = 3 }: BudgetCardSkeletonProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
