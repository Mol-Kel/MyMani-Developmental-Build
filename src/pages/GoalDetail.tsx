import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProgressBar } from '@/components/ProgressBar';
import { goalStorage } from '@/lib/storage';
import { SavingsGoal } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';

const GoalDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadGoal();
  }, [id]);

  const loadGoal = () => {
    const goals = goalStorage.getAll();
    const found = goals.find(g => g.id === id);
    if (found) {
      setGoal(found);
    } else {
      toast.error('Goal not found');
      navigate('/goals');
    }
  };

  const handleAddDeposit = () => {
    if (!goal) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const deposit = {
      id: Date.now().toString(),
      amount: Math.round(amount * 100),
      date: new Date().toISOString(),
      note: depositNote.trim() || undefined,
    };

    const newCurrentAmount = goal.currentAmount + deposit.amount;
    const isReached = newCurrentAmount >= goal.targetAmount;

    goalStorage.update(goal.id, {
      deposits: [...goal.deposits, deposit],
      currentAmount: newCurrentAmount,
      isReached,
    });

    if (isReached && !goal.isReached) {
      toast.success('🎉 Congratulations! You\'ve reached your goal!', {
        duration: 5000,
      });
    } else {
      toast.success('Deposit added successfully!');
    }

    setDepositAmount('');
    setDepositNote('');
    setIsDialogOpen(false);
    loadGoal();
  };

  const handleDeleteGoal = () => {
    if (!goal) return;
    
    if (confirm('Are you sure you want to delete this goal?')) {
      goalStorage.delete(goal.id);
      toast.success('Goal deleted');
      navigate('/goals');
    }
  };

  if (!goal) {
    return null;
  }

  const percentage = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-success text-success-foreground shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/goals')}
                className="text-success-foreground hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">{goal.title}</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteGoal}
              className="text-success-foreground hover:bg-white/20"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current</span>
              <span className="font-semibold">
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
              </span>
            </div>
            
            <ProgressBar value={percentage} variant="success" showLabel={true} />
            
            {!goal.isReached && (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(remaining)} remaining to reach your goal
              </p>
            )}
            
            <p className="text-sm font-medium" style={{ color: goal.isReached ? 'hsl(var(--success))' : 'hsl(var(--accent))' }}>
              {goal.isReached ? "🎉 Goal reached! Great job!" :
               percentage < 25 ? "💪 You've got this! Keep saving!" :
               percentage < 50 ? "🌟 Great momentum! Keep it going!" :
               percentage < 75 ? "🚀 Excellent progress! Almost there!" :
               "⭐ Final stretch! Victory is near!"}
            </p>

            {goal.targetDate && (
              <p className="text-sm text-muted-foreground">
                Target date: {formatDate(goal.targetDate)}
              </p>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="success" className="w-full" size="lg">
                  <Plus className="w-4 h-4" />
                  Add Deposit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Deposit</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="depositAmount">Amount *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R
                      </span>
                      <Input
                        id="depositAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="depositNote">Note (optional)</Label>
                    <Input
                      id="depositNote"
                      placeholder="Add a note..."
                      value={depositNote}
                      onChange={(e) => setDepositNote(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="success"
                      onClick={handleAddDeposit}
                      className="flex-1"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Deposits History */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Deposit History</CardTitle>
          </CardHeader>
          <CardContent>
            {goal.deposits.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No deposits yet. Add your first deposit to get started!
              </p>
            ) : (
              <div className="space-y-3">
                {[...goal.deposits].reverse().map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex justify-between items-start p-4 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-semibold text-success">
                        +{formatCurrency(deposit.amount)}
                      </p>
                      {deposit.note && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {deposit.note}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(deposit.date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default GoalDetail;
