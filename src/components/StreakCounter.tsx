import { Flame } from 'lucide-react';
import { useStreak } from '@/hooks/useStreak';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  className?: string;
}

export const StreakCounter = ({ className }: StreakCounterProps) => {
  const streak = useStreak();

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-primary-foreground',
        className
      )}
    >
      <Flame className="w-5 h-5" />
      <span className="text-sm font-medium">{streak.currentStreak}</span>
    </div>
  );
};
