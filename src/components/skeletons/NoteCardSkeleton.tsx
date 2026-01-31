import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface NoteCardSkeletonProps {
  count?: number;
}

export const NoteCardSkeleton = ({ count = 4 }: NoteCardSkeletonProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Skeleton className="w-5 h-5 mt-1 rounded" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
