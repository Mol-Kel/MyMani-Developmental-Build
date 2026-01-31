import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TransactionListSkeletonProps {
  count?: number;
}

export const TransactionListSkeleton = ({ count = 5 }: TransactionListSkeletonProps) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, groupIdx) => (
        <div key={groupIdx} className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            {Array.from({ length: Math.ceil(count / 2) }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
