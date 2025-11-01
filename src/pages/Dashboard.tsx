import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Coffee, 
  Car, 
  Heart,
  Target,
  Settings,
  Calculator,
  Receipt,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/DashboardCard';
import { CategoryChip } from '@/components/CategoryChip';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { formatCurrency, getGreeting } from '@/lib/formatters';
import { transactionStorage, budgetStorage, goalStorage, userStorage } from '@/lib/storage';
import { useTheme } from 'next-themes';

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [userName, setUserName] = useState('');
  const [dailySpent, setDailySpent] = useState(0);
  const [balance, setBalance] = useState(0);
  const [savingsProgress, setSavingsProgress] = useState(0);

  useEffect(() => {
    // Load user name
    setUserName(userStorage.getName());
    
    // Calculate daily spent
    const transactions = transactionStorage.getAll();
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(t => 
      new Date(t.date).toDateString() === today
    );
    
    const spent = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const income = todayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    setDailySpent(spent);
    
    // Calculate total balance
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    setBalance(totalIncome - totalExpenses);
    
    // Calculate savings progress
    const goals = goalStorage.getAll();
    if (goals.length > 0) {
      const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
      const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
      setSavingsProgress(totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0);
    }
  }, []);

  const handleAddExpense = () => {
    navigate('/add-transaction?type=expense');
  };

  const handleAddIncome = () => {
    navigate('/add-transaction?type=income');
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/add-transaction?type=expense&category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">MyMani</h1>
                <p className="text-sm opacity-90">Take control of your finances</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/notes')}
                className="text-primary-foreground hover:bg-white/20"
              >
                <BookOpen className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/calculator')}
                className="text-primary-foreground hover:bg-white/20"
              >
                <Calculator className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                className="text-primary-foreground hover:bg-white/20"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {userName}!
          </h2>
          <p className="text-muted-foreground">How are you doing today?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            size="lg" 
            variant="expense"
            onClick={handleAddExpense}
            className="w-full h-16 text-lg"
          >
            <TrendingDown className="w-6 h-6" />
            Add Expense
          </Button>
          <Button 
            size="lg" 
            variant="success"
            onClick={handleAddIncome}
            className="w-full h-16 text-lg"
          >
            <TrendingUp className="w-6 h-6" />
            Add Income
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Spent Today"
            value={formatCurrency(dailySpent)}
            icon={<Receipt className="w-6 h-6" />}
            variant="accent"
          />
          <StatCard
            label="Balance"
            value={formatCurrency(balance)}
            icon={<Wallet className="w-6 h-6" />}
            variant="primary"
          />
          <StatCard
            label="Savings Progress"
            value={`${Math.round(savingsProgress)}%`}
            icon={<Target className="w-6 h-6" />}
            variant="success"
          />
        </div>

        {/* Quick Category Chips */}
        <DashboardCard title="Quick Add by Category" icon={<ShoppingBag className="w-5 h-5" />}>
          <div className="grid grid-cols-4 gap-3">
            <CategoryChip
              label="Food"
              icon={<Coffee className="w-6 h-6" />}
              onClick={() => handleCategoryClick('Food & Dining')}
            />
            <CategoryChip
              label="Transport"
              icon={<Car className="w-6 h-6" />}
              onClick={() => handleCategoryClick('Transport')}
            />
            <CategoryChip
              label="Shopping"
              icon={<ShoppingBag className="w-6 h-6" />}
              onClick={() => handleCategoryClick('Shopping')}
            />
            <CategoryChip
              label="Health"
              icon={<Heart className="w-6 h-6" />}
              onClick={() => handleCategoryClick('Healthcare')}
            />
          </div>
        </DashboardCard>

        {/* Savings Progress Detail */}
        <DashboardCard title="Savings Goals Progress" icon={<Target className="w-5 h-5" />}>
          <div className="space-y-4">
            <ProgressBar value={savingsProgress} variant="success" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Keep going! You're making great progress.
              </span>
              <Button variant="link" onClick={() => navigate('/goals')}>
                View Goals
              </Button>
            </div>
          </div>
        </DashboardCard>

        {/* Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => navigate('/transactions')}
          >
            <Receipt className="w-8 h-8 text-primary" />
            <span>Transactions</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => navigate('/budgets')}
          >
            <Wallet className="w-8 h-8 text-primary" />
            <span>Budgets</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => navigate('/goals')}
          >
            <Target className="w-8 h-8 text-success" />
            <span>Goals</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => navigate('/reports')}
          >
            <TrendingUp className="w-8 h-8 text-accent" />
            <span>Reports</span>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
