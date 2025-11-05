import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStreak } from '@/hooks/useStreak';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const StreakCounter = () => {
  const streak = useStreak();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-white/20 gap-1"
          >
            <Flame className="w-5 h-5" />
            <span className="font-bold">{streak}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{streak} day{streak !== 1 ? 's' : ''} streak! Keep it up! 🔥</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
