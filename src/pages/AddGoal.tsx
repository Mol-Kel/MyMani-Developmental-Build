import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { goalStorage } from '@/lib/storage';
import { formatDateForInput } from '@/lib/formatters';
import { toast } from 'sonner';

const AddGoal = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    const goal = {
      id: Date.now().toString(),
      title: title.trim(),
      targetAmount: Math.round(amount * 100),
      currentAmount: 0,
      targetDate: targetDate || undefined,
      isReached: false,
      deposits: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    goalStorage.add(goal);
    toast.success('Savings goal created!');
    navigate('/goals');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-success text-success-foreground shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/goals')}
              className="text-success-foreground hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Create Savings Goal</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Goal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Emergency Fund, New Laptop"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R
                  </span>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="pl-8 text-lg h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date (optional)</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-12"
                  min={formatDateForInput(new Date().toISOString())}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/goals')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="success" className="flex-1">
                  <Save className="w-4 h-4" />
                  Create Goal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddGoal;
