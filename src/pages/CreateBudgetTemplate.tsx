import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { budgetTemplateStorage, categoryStorage, userStorage } from '@/lib/storage';
import { toast } from 'sonner';
import type { BudgetTemplate } from '@/types';

export default function CreateBudgetTemplate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [templateName, setTemplateName] = useState('');
  const [budgets, setBudgets] = useState<Array<{ category: string; amount: string }>>([
    { category: '', amount: '' }
  ]);
  const [categories, setCategories] = useState<string[]>([]);
  const currency = userStorage.getCurrency();

  useEffect(() => {
    const expenseCategories = categoryStorage.getExpenseCategories();
    setCategories(expenseCategories);

    if (isEditing) {
      const templates = budgetTemplateStorage.getAll();
      const template = templates.find(t => t.id === id);
      if (template) {
        setTemplateName(template.name);
        setBudgets(template.budgets.map(b => ({
          category: b.category,
          amount: (b.allocatedAmount / 100).toString()
        })));
      }
    }
  }, [id, isEditing]);

  const handleAddBudget = () => {
    setBudgets([...budgets, { category: '', amount: '' }]);
  };

  const handleRemoveBudget = (index: number) => {
    if (budgets.length > 1) {
      setBudgets(budgets.filter((_, i) => i !== index));
    }
  };

  const handleBudgetChange = (index: number, field: 'category' | 'amount', value: string) => {
    const updated = [...budgets];
    updated[index][field] = value;
    setBudgets(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const validBudgets = budgets.filter(b => b.category && b.amount && parseFloat(b.amount) > 0);
    
    if (validBudgets.length === 0) {
      toast.error('Please add at least one budget with a category and amount');
      return;
    }

    const templateData = {
      name: templateName,
      budgets: validBudgets.map(b => ({
        category: b.category,
        allocatedAmount: Math.round(parseFloat(b.amount) * 100)
      }))
    };

    if (isEditing) {
      budgetTemplateStorage.update(id, templateData);
      toast.success('Template updated');
    } else {
      budgetTemplateStorage.add(templateData);
      toast.success('Template created');
    }

    navigate('/budgets/templates');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/budgets/templates')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Template' : 'Create Template'}
            </h1>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Monthly Budget, Strict Budget"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Budget Categories</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={handleAddBudget}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgets.map((budget, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`category-${index}`}>Category</Label>
                    <Select
                      value={budget.category}
                      onValueChange={(value) => handleBudgetChange(index, 'category', value)}
                    >
                      <SelectTrigger id={`category-${index}`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`amount-${index}`}>Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currency}
                      </span>
                      <Input
                        id={`amount-${index}`}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={budget.amount}
                        onChange={(e) => handleBudgetChange(index, 'amount', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBudget(index)}
                    disabled={budgets.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/budgets/templates')}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {isEditing ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
