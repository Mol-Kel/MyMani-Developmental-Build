import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCard } from '@/components/DashboardCard';
import { UserMenu } from '@/components/UserMenu';
import { ReportsSkeleton } from '@/components/skeletons';
import { supabaseTransactionStorage } from '@/lib/supabase-storage';
import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const Reports = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryData, setCategoryData] = useState<Record<string, number>>({});
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const allTransactions = await supabaseTransactionStorage.getAll();
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'daily':
          startDate = new Date(now.toDateString());
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const filtered = allTransactions.filter(t => 
        new Date(t.date) >= startDate
      );

      setTransactions(filtered);

      // Calculate category spending
      const categories: Record<string, number> = {};
      const income = filtered
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = filtered
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
          categories[t.category] = (categories[t.category] || 0) + t.amount;
          return sum + t.amount;
        }, 0);

      setCategoryData(categories);
      setTotalIncome(income);
      setTotalExpenses(expenses);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const topCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-accent text-accent-foreground shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-accent-foreground hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Reports</h1>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Period Selector */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={period === 'daily' ? 'default' : 'outline'}
                onClick={() => setPeriod('daily')}
              >
                Daily
              </Button>
              <Button
                variant={period === 'weekly' ? 'default' : 'outline'}
                onClick={() => setPeriod('weekly')}
              >
                Weekly
              </Button>
              <Button
                variant={period === 'monthly' ? 'default' : 'outline'}
                onClick={() => setPeriod('monthly')}
              >
                Monthly
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <ReportsSkeleton />
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(totalIncome)}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-accent">
                    {formatCurrency(totalExpenses)}
                  </p>
                </CardContent>
              </Card>

              <Card className={cn(
                "shadow-md",
                balance >= 0 ? "bg-success/10" : "bg-destructive/10"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Net Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={cn(
                    "text-2xl font-bold",
                    balance >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatCurrency(balance)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Spending Categories */}
            <DashboardCard 
              title="Top Spending Categories" 
              icon={<PieChart className="w-5 h-5" />}
            >
              {topCategories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No expenses recorded for this period
                </p>
              ) : (
                <div className="space-y-4">
                  {topCategories.map(([category, amount]) => {
                    const percentage = (amount / totalExpenses) * 100;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{category}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(amount)} ({Math.round(percentage)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-accent transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </DashboardCard>

            {/* Transaction Count */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Transaction Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Transactions
                    </p>
                    <p className="text-2xl font-bold">{transactions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Average per Day
                    </p>
                    <p className="text-2xl font-bold">
                      {period === 'daily' 
                        ? transactions.length
                        : period === 'weekly'
                        ? Math.round(transactions.length / 7)
                        : Math.round(transactions.length / 30)
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;
