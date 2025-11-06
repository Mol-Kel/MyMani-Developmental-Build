import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ProgressBar';
import { goalStorage } from '@/lib/storage';
import { SavingsGoal } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';

const Goals = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = () => {
    const allGoals = goalStorage.getAll();
    setGoals(allGoals);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-success text-success-foreground shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-success-foreground hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Savings Goals</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/add-goal')}
              className="text-success-foreground hover:bg-white/20"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {goals.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Target className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No savings goals yet</h3>
                <p className="text-muted-foreground mb-4">
                  Set goals and track your progress towards achieving them
                </p>
                <Button variant="success" onClick={() => navigate('/add-goal')}>
                  <Plus className="w-4 h-4" />
                  Create Goal
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const percentage = (goal.currentAmount / goal.targetAmount) * 100;
              
              return (
                <Card 
                  key={goal.id} 
                  className="shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={() => navigate(`/goal/${goal.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{goal.title}</span>
                      {goal.isReached && (
                        <span className="text-sm bg-success text-success-foreground px-3 py-1 rounded-full">
                          ✓ Reached
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    
                    <ProgressBar 
                      value={percentage} 
                      variant="success"
                      showLabel={true}
                    />
                    
                    {goal.targetDate && (
                      <p className="text-sm text-muted-foreground">
                        Target date: {formatDate(goal.targetDate)}
                      </p>
                    )}
                    
                    {goal.isReached && (
                      <p className="text-sm text-success font-medium">
                        🎉 Congratulations! You've reached your goal!
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

export default Goals;
