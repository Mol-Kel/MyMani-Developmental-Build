import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProgressBar } from '@/components/ProgressBar';
import { supabaseGoalStorage } from '@/lib/supabase-storage';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGoal();
  }, [id]);

  const loadGoal = async () => {
    try {
      setIsLoading(true);
      if (!id) return;
      const found = await supabaseGoalStorage.getById(id);
      if (found) {
        setGoal(found);
      } else {
        toast.error('Goal not found');
        navigate('/goals');
      }
    } catch (error) {
      console.error('Error loading goal:', error);
      toast.error('Failed to load goal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDeposit = async () => {
    if (!goal) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await supabaseGoalStorage.addDeposit(goal.id, {
        amount,
        date: new Date().toISOString(),
        note: depositNote.trim() || undefined,
      });

      const updatedGoal = await supabaseGoalStorage.getById(goal.id);
      if (updatedGoal && updatedGoal.isReached && !goal.isReached) {
        toast.success('🎉 Congratulations! You\'ve reached your goal!', { duration: 5000 });
      } else {
        toast.success('Deposit added successfully!');
      }

      setDepositAmount('');
      setDepositNote('');
      setIsDialogOpen(false);
      await loadGoal();
    } catch (error) {
      console.error('Error adding deposit:', error);
      toast.error('Failed to add deposit');
    }
  };

  const handleDeleteGoal = async () => {
    if (!goal) return;
    
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await supabaseGoalStorage.delete(goal.id);
        toast.success('Goal deleted');
        navigate('/goals');
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast.error('Failed to delete goal');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!goal) return null;

  const percentage = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-success text-success-foreground shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/goals')} className="text-success-foreground hover:bg-white/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">{goal.title}</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDeleteGoal} className="text-success-foreground hover:bg-white/20">
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current</span>
              <span className="font-semibold">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
            </div>
            <ProgressBar value={percentage} variant="success" showLabel={true} />
            {!goal.isReached && <p className="text-sm text-muted-foreground">{formatCurrency(remaining)} remaining</p>}
            {goal.targetDate && <p className="text-sm text-muted-foreground">Target date: {formatDate(goal.targetDate)}</p>}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="success" className="w-full" size="lg"><Plus className="w-4 h-4" />Add Deposit</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Deposit</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="depositAmount">Amount *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                      <Input id="depositAmount" type="number" step="0.01" min="0" placeholder="0.00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="pl-8" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depositNote">Note (optional)</Label>
                    <Input id="depositNote" placeholder="Add a note..." value={depositNote} onChange={(e) => setDepositNote(e.target.value)} />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">Cancel</Button>
                    <Button variant="success" onClick={handleAddDeposit} className="flex-1">Add</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader><CardTitle>Deposit History</CardTitle></CardHeader>
          <CardContent>
            {goal.deposits.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No deposits yet.</p>
            ) : (
              <div className="space-y-3">
                {[...goal.deposits].reverse().map((deposit) => (
                  <div key={deposit.id} className="flex justify-between items-start p-4 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-semibold text-success">+{formatCurrency(deposit.amount)}</p>
                      {deposit.note && <p className="text-sm text-muted-foreground mt-1">{deposit.note}</p>}
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDate(deposit.date)}</p>
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
