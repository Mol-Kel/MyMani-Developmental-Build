import { differenceInDays, isPast, isToday, isTomorrow } from 'date-fns';

export type UrgencyLevel = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'upcoming' | 'none';

export interface UrgencyInfo {
  level: UrgencyLevel;
  label: string;
  color: string;
  bgColor: string;
}

export const getUrgencyInfo = (dueDate?: string): UrgencyInfo => {
  if (!dueDate) {
    return {
      level: 'none',
      label: 'No due date',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
    };
  }

  const due = new Date(dueDate);
  const now = new Date();

  if (isPast(due) && !isToday(due)) {
    return {
      level: 'overdue',
      label: 'Overdue',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    };
  }

  if (isToday(due)) {
    return {
      level: 'today',
      label: 'Due today',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
    };
  }

  if (isTomorrow(due)) {
    return {
      level: 'tomorrow',
      label: 'Due tomorrow',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    };
  }

  const daysUntil = differenceInDays(due, now);
  
  if (daysUntil <= 7) {
    return {
      level: 'soon',
      label: `Due in ${daysUntil} days`,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    };
  }

  return {
    level: 'upcoming',
    label: `Due ${due.toLocaleDateString()}`,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  };
};
