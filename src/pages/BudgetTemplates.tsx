import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseBudgetTemplateStorage, supabaseBudgetStorage } from '@/lib/supabase-storage';
import { formatCurrency } from '@/lib/formatters';
import type { BudgetTemplate } from '@/types';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BudgetTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [applyTemplate, setApplyTemplate] = useState<BudgetTemplate | null>(null);
  const [targetMonth, setTargetMonth] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadTemplates();
    // Set default target month to current month
    const now = new Date();
    setTargetMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const allTemplates = await supabaseBudgetTemplateStorage.getAll();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await supabaseBudgetTemplateStorage.delete(deleteId);
        await loadTemplates();
        toast.success('Template deleted');
      } catch (error) {
        toast.error('Failed to delete template');
      } finally {
        setDeleteId(null);
      }
    }
  };

  const handleApplyTemplate = async () => {
    if (!applyTemplate || !targetMonth) return;

    setIsApplying(true);
    try {
      const existingBudgets = await supabaseBudgetStorage.getAll();
      let created = 0;
      let skipped = 0;

      for (const templateBudget of applyTemplate.budgets) {
        const exists = existingBudgets.some(
          b => b.category === templateBudget.category && b.month === targetMonth
        );

        if (!exists) {
          await supabaseBudgetStorage.add({
            category: templateBudget.category,
            allocatedAmount: templateBudget.allocatedAmount,
            month: targetMonth,
          });
          created++;
        } else {
          skipped++;
        }
      }

      toast.success(`Applied template: ${created} budgets created${skipped > 0 ? `, ${skipped} skipped (already exist)` : ''}`);
      setApplyTemplate(null);
      navigate('/budgets');
    } catch (error) {
      toast.error('Failed to apply template');
    } finally {
      setIsApplying(false);
    }
  };

  const getTotalAmount = (template: BudgetTemplate) => {
    return template.budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/budgets')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Budget Templates</h1>
            </div>
            <Button onClick={() => navigate('/budgets/templates/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">No templates yet</p>
              <Button onClick={() => navigate('/budgets/templates/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>
                      {template.budgets.length} {template.budgets.length === 1 ? 'category' : 'categories'} • Total: {formatCurrency(getTotalAmount(template))}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setApplyTemplate(template)}
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/budgets/templates/edit/${template.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {template.budgets.map((budget, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{budget.category}</span>
                      <span className="font-medium">{formatCurrency(budget.allocatedAmount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this budget template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={applyTemplate !== null} onOpenChange={() => setApplyTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
            <DialogDescription>
              Select the month to apply "{applyTemplate?.name}" template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="month">Target Month</Label>
              <Input
                id="month"
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleApplyTemplate} disabled={isApplying}>
              {isApplying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
