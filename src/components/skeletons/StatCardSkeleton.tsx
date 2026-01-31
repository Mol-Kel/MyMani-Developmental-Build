import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const StatCardSkeleton = () => {
  return (
    <Card className="p-4 shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
    </Card>
  );
};
