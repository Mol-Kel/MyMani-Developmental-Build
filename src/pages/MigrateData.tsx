import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEYS = {
  TRANSACTIONS: 'mymani_transactions',
  BUDGETS: 'mymani_budgets',
  GOALS: 'mymani_goals',
  NOTES: 'mymani_notes',
  USER_NAME: 'mymani_user_name',
  CURRENCY: 'mymani_currency',
  EXPENSE_CATEGORIES: 'mymani_expense_categories',
  INCOME_CATEGORIES: 'mymani_income_categories',
};

interface MigrationStats {
  transactions: number;
  budgets: number;
  goals: number;
  notes: number;
}

const MigrateData = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decimalToCents = (decimal: number): number => Math.round(decimal * 100);

  const getLocalData = () => {
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    const budgets = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS) || '[]');
    const goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || '[]');
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]');
    const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    const currency = localStorage.getItem(STORAGE_KEYS.CURRENCY);
    const expenseCategories = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES) || 'null');
    const incomeCategories = JSON.parse(localStorage.getItem(STORAGE_KEYS.INCOME_CATEGORIES) || 'null');

    return { transactions, budgets, goals, notes, userName, currency, expenseCategories, incomeCategories };
  };

  const hasLocalData = () => {
    const { transactions, budgets, goals, notes } = getLocalData();
    return transactions.length > 0 || budgets.length > 0 || goals.length > 0 || notes.length > 0;
  };

  const migrateData = async () => {
    if (!user) {
      toast.error('You must be logged in to migrate data');
      return;
    }

    setMigrating(true);
    setProgress(0);
    setError(null);

    try {
      const { transactions, budgets, goals, notes, userName, currency, expenseCategories, incomeCategories } = getLocalData();

      const totalItems = transactions.length + budgets.length + goals.length + notes.length;
      let processedItems = 0;

      // Update profile with local preferences
      if (userName || currency) {
        const updates: Record<string, string> = {};
        if (userName) updates.full_name = JSON.parse(userName);
        if (currency) updates.currency = JSON.parse(currency);
        
        await supabase.from('profiles').update(updates).eq('id', user.id);
      }
      setProgress(10);

      // Migrate transactions
      if (transactions.length > 0) {
        const transactionData = transactions.map((t: any) => ({
          user_id: user.id,
          type: t.type,
          amount: decimalToCents(t.amount),
          currency: t.currency || 'ZAR',
          category: t.category,
          date: t.date,
          note: t.note,
          receipt_uri: t.receiptUri,
          recurring: t.recurring || false,
        }));

        const { error } = await supabase.from('transactions').insert(transactionData);
        if (error) throw error;
        
        processedItems += transactions.length;
        setProgress(10 + (processedItems / totalItems) * 70);
      }

      // Migrate budgets
      if (budgets.length > 0) {
        const budgetData = budgets.map((b: any) => ({
          user_id: user.id,
          category: b.category,
          allocated_amount: decimalToCents(b.allocatedAmount),
          month: b.month,
        }));

        const { error } = await supabase.from('budgets').insert(budgetData);
        if (error) throw error;

        processedItems += budgets.length;
        setProgress(10 + (processedItems / totalItems) * 70);
      }

      // Migrate goals and their deposits
      if (goals.length > 0) {
        for (const goal of goals) {
          const { data: newGoal, error: goalError } = await supabase
            .from('savings_goals')
            .insert({
              user_id: user.id,
              title: goal.title,
              target_amount: decimalToCents(goal.targetAmount),
              current_amount: decimalToCents(goal.currentAmount || 0),
              target_date: goal.targetDate,
              is_reached: goal.isReached || false,
            })
            .select()
            .single();

          if (goalError) throw goalError;

          // Migrate deposits for this goal
          if (goal.deposits && goal.deposits.length > 0) {
            const depositData = goal.deposits.map((d: any) => ({
              goal_id: newGoal.id,
              user_id: user.id,
              amount: decimalToCents(d.amount),
              date: d.date,
              note: d.note,
            }));

            const { error: depositError } = await supabase.from('deposits').insert(depositData);
            if (depositError) throw depositError;
          }

          processedItems++;
          setProgress(10 + (processedItems / totalItems) * 70);
        }
      }

      // Migrate notes
      if (notes.length > 0) {
        const noteData = notes.map((n: any) => ({
          user_id: user.id,
          content: n.content,
          date: n.date,
          is_todo: n.isTodo || false,
          is_completed: n.isCompleted || false,
          due_date: n.dueDate,
        }));

        const { error } = await supabase.from('notes').insert(noteData);
        if (error) throw error;

        processedItems += notes.length;
        setProgress(10 + (processedItems / totalItems) * 70);
      }

      // Migrate custom categories
      if (expenseCategories) {
        await supabase.from('custom_categories').upsert({
          user_id: user.id,
          type: 'expense',
          categories: expenseCategories,
        });
      }
      if (incomeCategories) {
        await supabase.from('custom_categories').upsert({
          user_id: user.id,
          type: 'income',
          categories: incomeCategories,
        });
      }

      setProgress(90);

      // Clear local storage after successful migration
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      localStorage.removeItem('budgetTemplates');

      setProgress(100);
      setStats({
        transactions: transactions.length,
        budgets: budgets.length,
        goals: goals.length,
        notes: notes.length,
      });

      toast.success('Data migrated successfully!');
    } catch (err: any) {
      console.error('Migration error:', err);
      setError(err.message || 'Failed to migrate data');
      toast.error('Migration failed. Your local data is still intact.');
    } finally {
      setMigrating(false);
    }
  };

  const localDataExists = hasLocalData();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Migrate Data</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Migration
            </CardTitle>
            <CardDescription>
              Transfer your locally stored data to your cloud account for access across all devices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Migration Complete!</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Transactions</p>
                    <p className="text-lg font-semibold">{stats.transactions}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Budgets</p>
                    <p className="text-lg font-semibold">{stats.budgets}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Goals</p>
                    <p className="text-lg font-semibold">{stats.goals}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="text-lg font-semibold">{stats.notes}</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/')} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Migration Failed</span>
                </div>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button onClick={migrateData} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            ) : migrating ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Migrating your data...</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">{Math.round(progress)}%</p>
              </div>
            ) : localDataExists ? (
              <div className="space-y-4">
                <p className="text-sm">
                  We found data stored locally on this device. Would you like to migrate it to your cloud account?
                </p>
                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> This will move your local data to the cloud and remove it from this device's local storage.
                  </p>
                </div>
                <Button onClick={migrateData} className="w-full">
                  Start Migration
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-5 h-5" />
                  <span>No local data found to migrate</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your data is already synced to the cloud, or you're starting fresh with a new account.
                </p>
                <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MigrateData;
