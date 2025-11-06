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
        'flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg border border-accent/20',
        className
      )}
    >
      <Flame className="w-5 h-5 text-accent" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Streak</span>
        <span className="text-sm font-bold text-accent">{streak.currentStreak} days</span>
      </div>
    </div>
  );
};
