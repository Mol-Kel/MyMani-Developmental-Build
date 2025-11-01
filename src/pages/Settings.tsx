import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, BookOpen, Tag, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { userStorage, transactionStorage, budgetStorage, goalStorage } from '@/lib/storage';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { exportTransactionsToCSV, exportBudgetsToCSV, exportGoalsToCSV, exportAllData } from '@/lib/export';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setUserName(userStorage.getName());
  }, []);

  const handleSaveName = () => {
    if (userName.trim()) {
      userStorage.setName(userName.trim());
      toast.success('Name updated successfully');
    }
  };

  const handleExportTransactions = () => {
    const transactions = transactionStorage.getAll();
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }
    exportTransactionsToCSV(transactions);
    toast.success('Transactions exported successfully');
  };

  const handleExportBudgets = () => {
    const budgets = budgetStorage.getAll();
    if (budgets.length === 0) {
      toast.error('No budgets to export');
      return;
    }
    exportBudgetsToCSV(budgets);
    toast.success('Budgets exported successfully');
  };

  const handleExportGoals = () => {
    const goals = goalStorage.getAll();
    if (goals.length === 0) {
      toast.error('No goals to export');
      return;
    }
    exportGoalsToCSV(goals);
    toast.success('Goals exported successfully');
  };

  const handleExportAll = () => {
    const transactions = transactionStorage.getAll();
    const budgets = budgetStorage.getAll();
    const goals = goalStorage.getAll();
    
    if (transactions.length === 0 && budgets.length === 0 && goals.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    exportAllData(transactions, budgets, goals);
    toast.success('All data exported successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                />
                <Button onClick={handleSaveName}>Save</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="w-full"
                >
                  <Sun className="w-4 h-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="w-full"
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/notes')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Manage Notes
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/manage-categories')}
            >
              <Tag className="w-4 h-4 mr-2" />
              Manage Categories
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportTransactions}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Transactions (CSV)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportBudgets}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Budgets (CSV)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportGoals}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Goals (CSV)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportAll}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Data (JSON)
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              MyMani - Your personal finance companion
            </p>
            <p className="text-sm text-muted-foreground">
              Version 1.0.0
            </p>
            <p className="text-sm text-muted-foreground">
              All data is stored locally on your device
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
