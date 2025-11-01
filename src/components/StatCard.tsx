import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'success' | 'accent' | 'default';
  className?: string;
}

export const StatCard = ({ label, value, icon, variant = 'default', className }: StatCardProps) => {
  const variantClasses = {
    primary: 'bg-gradient-primary text-primary-foreground',
    success: 'bg-gradient-success text-success-foreground',
    accent: 'bg-gradient-accent text-accent-foreground',
    default: 'bg-gradient-card',
  };
  
  return (
    <Card className={cn('p-4 shadow-md hover:shadow-lg transition-all duration-300', variantClasses[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            'text-sm font-medium mb-1',
            variant === 'default' ? 'text-muted-foreground' : 'opacity-90'
          )}>
            {label}
          </p>
          <p className={cn(
            'text-2xl font-bold',
            variant === 'default' ? 'text-foreground' : ''
          )}>
            {value}
          </p>
        </div>
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center',
          variant === 'default' ? 'bg-primary/10 text-primary' : 'bg-white/20'
        )}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
