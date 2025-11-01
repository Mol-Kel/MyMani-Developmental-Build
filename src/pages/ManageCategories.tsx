import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { categoryStorage } from '@/lib/storage';
import { toast } from 'sonner';

const ManageCategories = () => {
  const navigate = useNavigate();
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newIncomeCategory, setNewIncomeCategory] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setExpenseCategories(categoryStorage.getExpenseCategories());
    setIncomeCategories(categoryStorage.getIncomeCategories());
  };

  const handleAddExpenseCategory = () => {
    if (!newExpenseCategory.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    if (expenseCategories.includes(newExpenseCategory.trim())) {
      toast.error('Category already exists');
      return;
    }

    categoryStorage.addExpenseCategory(newExpenseCategory.trim());
    setNewExpenseCategory('');
    loadCategories();
    toast.success('Category added');
  };

  const handleAddIncomeCategory = () => {
    if (!newIncomeCategory.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    if (incomeCategories.includes(newIncomeCategory.trim())) {
      toast.error('Category already exists');
      return;
    }

    categoryStorage.addIncomeCategory(newIncomeCategory.trim());
    setNewIncomeCategory('');
    loadCategories();
    toast.success('Category added');
  };

  const handleDeleteExpenseCategory = (category: string) => {
    if (confirm(`Delete "${category}" category? This won't affect existing transactions.`)) {
      categoryStorage.removeExpenseCategory(category);
      loadCategories();
      toast.success('Category deleted');
    }
  };

  const handleDeleteIncomeCategory = (category: string) => {
    if (confirm(`Delete "${category}" category? This won't affect existing transactions.`)) {
      categoryStorage.removeIncomeCategory(category);
      loadCategories();
      toast.success('Category deleted');
    }
  };

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
            <h1 className="text-xl font-bold">Manage Categories</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="expense" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">Expense Categories</TabsTrigger>
            <TabsTrigger value="income">Income Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Expense Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter category name"
                      value={newExpenseCategory}
                      onChange={(e) => setNewExpenseCategory(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddExpenseCategory()}
                    />
                  </div>
                  <Button onClick={handleAddExpenseCategory}>
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Categories ({expenseCategories.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expenseCategories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span>{category}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExpenseCategory(category)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Income Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter category name"
                      value={newIncomeCategory}
                      onChange={(e) => setNewIncomeCategory(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddIncomeCategory()}
                    />
                  </div>
                  <Button onClick={handleAddIncomeCategory}>
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income Categories ({incomeCategories.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incomeCategories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span>{category}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteIncomeCategory(category)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ManageCategories;
