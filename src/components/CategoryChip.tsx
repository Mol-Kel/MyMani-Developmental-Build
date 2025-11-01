import { cn } from '@/lib/utils';

interface CategoryChipProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'expense' | 'income';
}

export const CategoryChip = ({ label, icon, onClick, variant = 'expense' }: CategoryChipProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300',
        'bg-card border-2 border-border hover:border-primary hover:shadow-md',
        'active:scale-95',
        variant === 'income' && 'hover:border-success'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
          variant === 'expense' ? 'bg-accent/20 text-accent' : 'bg-success/20 text-success'
        )}
      >
        {icon}
      </div>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </button>
  );
};
