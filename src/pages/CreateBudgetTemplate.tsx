import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabaseBudgetTemplateStorage, supabaseCategoryStorage } from '@/lib/supabase-storage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function CreateBudgetTemplate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const isEditing = !!id;

  const [templateName, setTemplateName] = useState('');
  const [budgets, setBudgets] = useState<Array<{ category: string; amount: string }>>([
    { category: '', amount: '' }
  ]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const currency = profile?.currency || 'ZAR';

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const expenseCategories = await supabaseCategoryStorage.getCategories('expense');
        setCategories(expenseCategories);

        if (isEditing) {
          const templates = await supabaseBudgetTemplateStorage.getAll();
          const template = templates.find(t => t.id === id);
          if (template) {
            setTemplateName(template.name);
            setBudgets(template.budgets.map(b => ({
              category: b.category,
              amount: b.allocatedAmount.toString()
            })));
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSaving(true);
    try {
      const templateData = {
        name: templateName,
        budgets: validBudgets.map(b => ({
          category: b.category,
          allocatedAmount: parseFloat(b.amount)
        }))
      };

      if (isEditing && id) {
        await supabaseBudgetTemplateStorage.update(id, templateData);
        toast.success('Template updated');
      } else {
        await supabaseBudgetTemplateStorage.add(templateData);
        toast.success('Template created');
      }

      navigate('/budgets/templates');
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                        className="pl-12"
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
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
