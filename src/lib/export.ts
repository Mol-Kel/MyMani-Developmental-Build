import { Transaction, Budget, SavingsGoal } from '@/types';
import { formatCurrency, formatDate } from './formatters';

export const exportToJSON = (data: any, filename: string) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  downloadBlob(blob, filename);
};

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Note', 'Recurring'];
  const rows = transactions.map(t => [
    formatDate(t.date),
    t.type,
    t.category,
    (t.amount / 100).toFixed(2),
    t.currency,
    t.note || '',
    t.recurring ? 'Yes' : 'No',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `mymani-transactions-${Date.now()}.csv`);
};

export const exportBudgetsToCSV = (budgets: Budget[]) => {
  const headers = ['Month', 'Category', 'Allocated', 'Spent', 'Remaining'];
  const rows = budgets.map(b => [
    b.month,
    b.category,
    (b.allocatedAmount / 100).toFixed(2),
    (b.spentAmount / 100).toFixed(2),
    ((b.allocatedAmount - b.spentAmount) / 100).toFixed(2),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `mymani-budgets-${Date.now()}.csv`);
};

export const exportGoalsToCSV = (goals: SavingsGoal[]) => {
  const headers = ['Title', 'Target Amount', 'Current Amount', 'Progress %', 'Target Date', 'Status'];
  const rows = goals.map(g => [
    g.title,
    (g.targetAmount / 100).toFixed(2),
    (g.currentAmount / 100).toFixed(2),
    ((g.currentAmount / g.targetAmount) * 100).toFixed(1),
    g.targetDate || 'No target date',
    g.isReached ? 'Reached' : 'In Progress',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `mymani-goals-${Date.now()}.csv`);
};

export const exportAllData = (transactions: Transaction[], budgets: Budget[], goals: SavingsGoal[]) => {
  const data = {
    exportDate: new Date().toISOString(),
    transactions,
    budgets,
    goals,
  };
  exportToJSON(data, `mymani-backup-${Date.now()}.json`);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
