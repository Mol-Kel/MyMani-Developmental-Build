import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // percentage 0-100
  max?: number;
  className?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

export const ProgressBar = ({ 
  value, 
  max = 100, 
  className, 
  variant = 'primary',
  showLabel = true 
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const getVariantClasses = () => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 85) return 'bg-warning';
    if (variant === 'success') return 'bg-gradient-success';
    return 'bg-gradient-primary';
  };
  
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-3 bg-secondary rounded-full overflow-hidden shadow-sm">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getVariantClasses()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
