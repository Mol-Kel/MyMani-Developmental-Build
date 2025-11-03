import { useEffect } from 'react';
import { budgetStorage, transactionStorage, storage } from '@/lib/storage';
import { toast } from 'sonner';

const ALERT_SETTINGS_KEY = 'mymani_alert_settings';
const ALERT_HISTORY_KEY = 'mymani_alert_history';

interface AlertSettings {
  enabled: boolean;
  thresholds: {
    warning: number; // percentage (e.g., 85)
    critical: number; // percentage (e.g., 95)
  };
}

interface AlertHistory {
  budgetId: string;
  level: 'warning' | 'critical' | 'exceeded';
  timestamp: string;
}

const DEFAULT_SETTINGS: AlertSettings = {
  enabled: true,
  thresholds: {
    warning: 85,
    critical: 95,
  },
};

export const getAlertSettings = (): AlertSettings => {
  return storage.get<AlertSettings>(ALERT_SETTINGS_KEY) || DEFAULT_SETTINGS;
};

export const setAlertSettings = (settings: AlertSettings): void => {
  storage.set(ALERT_SETTINGS_KEY, settings);
};

const getAlertHistory = (): AlertHistory[] => {
  return storage.get<AlertHistory[]>(ALERT_HISTORY_KEY) || [];
};

const addAlertHistory = (alert: AlertHistory): void => {
  const history = getAlertHistory();
  history.push(alert);
  // Keep only last 100 alerts
  if (history.length > 100) {
    history.shift();
  }
  storage.set(ALERT_HISTORY_KEY, history);
};

const shouldShowAlert = (budgetId: string, level: 'warning' | 'critical' | 'exceeded'): boolean => {
  const history = getAlertHistory();
  const lastAlert = history
    .filter(h => h.budgetId === budgetId && h.level === level)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  if (!lastAlert) return true;

  // Show alert again if last alert was more than 1 hour ago
  const hoursSinceLastAlert = (Date.now() - new Date(lastAlert.timestamp).getTime()) / (1000 * 60 * 60);
  return hoursSinceLastAlert > 1;
};

export const useBudgetAlerts = () => {
  useEffect(() => {
    const checkBudgets = () => {
      const settings = getAlertSettings();
      if (!settings.enabled) return;

      const budgets = budgetStorage.getAll();
      const transactions = transactionStorage.getAll();

      budgets.forEach(budget => {
        const spent = transactions
          .filter(t =>
            t.type === 'expense' &&
            t.category === budget.category &&
            t.date.startsWith(budget.month)
          )
          .reduce((sum, t) => sum + t.amount, 0);

        const percentage = (spent / budget.allocatedAmount) * 100;

        if (percentage >= 100 && shouldShowAlert(budget.id, 'exceeded')) {
          toast.error(
            `Budget Exceeded: ${budget.category}`,
            {
              description: `You've exceeded your budget by ${((percentage - 100)).toFixed(0)}%`,
              duration: 5000,
            }
          );
          addAlertHistory({
            budgetId: budget.id,
            level: 'exceeded',
            timestamp: new Date().toISOString(),
          });
        } else if (percentage >= settings.thresholds.critical && shouldShowAlert(budget.id, 'critical')) {
          toast.error(
            `Critical: ${budget.category}`,
            {
              description: `You've used ${percentage.toFixed(0)}% of your budget`,
              duration: 5000,
            }
          );
          addAlertHistory({
            budgetId: budget.id,
            level: 'critical',
            timestamp: new Date().toISOString(),
          });
        } else if (percentage >= settings.thresholds.warning && shouldShowAlert(budget.id, 'warning')) {
          toast.warning(
            `Budget Warning: ${budget.category}`,
            {
              description: `You've used ${percentage.toFixed(0)}% of your budget`,
              duration: 4000,
            }
          );
          addAlertHistory({
            budgetId: budget.id,
            level: 'warning',
            timestamp: new Date().toISOString(),
          });
        }
      });
    };

    // Check immediately
    checkBudgets();

    // Check every 5 minutes
    const interval = setInterval(checkBudgets, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};
