import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabaseTransactionStorage, supabaseCategoryStorage, supabaseUserStorage } from '@/lib/supabase-storage';
import { TransactionType } from '@/types';
import { formatDateForInput } from '@/lib/formatters';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const AddTransaction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  
  const [type, setType] = useState<TransactionType>((searchParams.get('type') as TransactionType) || 'expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [date, setDate] = useState(formatDateForInput(new Date().toISOString()));
  const [note, setNote] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [type]);

  const loadCategories = async () => {
    try {
      const cats = await supabaseCategoryStorage.getCategories(type);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    try {
      setIsSubmitting(true);
      await supabaseTransactionStorage.add({
        type,
        amount: amountValue,
        currency: profile?.currency || 'ZAR',
        category,
        date: new Date(date).toISOString(),
        note: note.trim() || undefined,
        recurring,
        receiptUri: receiptPreview || undefined,
      });
      
      toast.success(`${type === 'expense' ? 'Expense' : 'Income'} added successfully!`);
      navigate('/');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-white/20">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Add {type === 'expense' ? 'Expense' : 'Income'}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Transaction Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant={type === 'expense' ? 'expense' : 'outline'} onClick={() => setType('expense')} className="w-full">Expense</Button>
                  <Button type="button" variant={type === 'income' ? 'success' : 'outline'} onClick={() => setType('income')} className="w-full">Income</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                  <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-8 text-lg h-12" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category" className="h-12"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea id="note" placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="recurring">Recurring Transaction</Label>
                  <p className="text-sm text-muted-foreground">This transaction repeats regularly</p>
                </div>
                <Switch id="recurring" checked={recurring} onCheckedChange={setRecurring} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt (optional)</Label>
                {receiptPreview ? (
                  <div className="relative">
                    <img src={receiptPreview} alt="Receipt preview" className="w-full h-48 object-cover rounded-lg border" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setReceiptPreview(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input id="receipt" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <Label htmlFor="receipt" className="flex items-center justify-center gap-2 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Click to upload receipt</span>
                    </Label>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/')} className="flex-1">Cancel</Button>
                <Button type="submit" variant={type === 'expense' ? 'expense' : 'success'} className="flex-1" disabled={isSubmitting}>
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : 'Save Transaction'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddTransaction;
