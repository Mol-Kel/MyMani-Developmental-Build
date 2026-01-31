import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Wallet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ProgressBar';
import { UserMenu } from '@/components/UserMenu';
import { BudgetCardSkeleton } from '@/components/skeletons';
import { supabaseBudgetStorage, supabaseTransactionStorage } from '@/lib/supabase-storage';
import { Budget } from '@/types';
import { formatCurrency } from '@/lib/formatters';

const Budgets = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setIsLoading(true);
      const allBudgets = await supabaseBudgetStorage.getAll();
      
      // Update spent amounts
      const transactions = await supabaseTransactionStorage.getAll();
      
      const updatedBudgets = allBudgets.map(budget => {
        const spent = transactions
          .filter(t => 
            t.type === 'expense' &&
            t.category === budget.category &&
            t.date.startsWith(budget.month)
          )
          .reduce((sum, t) => sum + t.amount, 0);
        
        return { ...budget, spentAmount: spent };
      });
      
      setBudgets(updatedBudgets);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWarningLevel = (spent: number, allocated: number): 'safe' | 'warning' | 'danger' => {
    const percentage = (spent / allocated) * 100;
    if (percentage >= 100) return 'danger';
    if (percentage >= 85) return 'warning';
    return 'safe';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-primary-foreground hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Budgets</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/budgets/templates')}
                className="text-primary-foreground hover:bg-white/20"
              >
                <FileText className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/add-budget')}
                className="text-primary-foreground hover:bg-white/20"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <BudgetCardSkeleton count={3} />
        ) : budgets.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create budgets to track your spending by category
                </p>
                <Button onClick={() => navigate('/add-budget')}>
                  <Plus className="w-4 h-4" />
                  Create Budget
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const percentage = (budget.spentAmount / budget.allocatedAmount) * 100;
              const warningLevel = getWarningLevel(budget.spentAmount, budget.allocatedAmount);
              
              return (
                <Card key={budget.id} className="shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{budget.category}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {new Date(budget.month + '-01').toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-semibold">
                        {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.allocatedAmount)}
                      </span>
                    </div>
                    
                    <ProgressBar 
                      value={percentage} 
                      showLabel={true}
                    />
                    
                    {warningLevel === 'warning' && (
                      <p className="text-sm text-warning font-medium">
                        ⚠️ You've used {Math.round(percentage)}% of your budget
                      </p>
                    )}
                    
                    {warningLevel === 'danger' && (
                      <p className="text-sm text-destructive font-medium">
                        🚨 Budget exceeded by {formatCurrency(budget.spentAmount - budget.allocatedAmount)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Budgets;
