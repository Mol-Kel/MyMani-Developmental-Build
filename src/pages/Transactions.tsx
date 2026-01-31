import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, TrendingDown, TrendingUp, Image as ImageIcon, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { UserMenu } from '@/components/UserMenu';
import { TransactionListSkeleton } from '@/components/skeletons';
import { supabaseTransactionStorage } from '@/lib/supabase-storage';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const allTransactions = await supabaseTransactionStorage.getAll();
      // Sort by date, most recent first
      const sorted = allTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(sorted);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await supabaseTransactionStorage.delete(id);
        await loadTransactions();
        toast.success('Transaction deleted');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error('Failed to delete transaction');
      }
    }
  };

  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = formatDate(transaction.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-primary-foreground hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Transactions</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/import-statement')}
                className="text-primary-foreground hover:bg-white/20"
                title="Import bank statement"
              >
                <Upload className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/add-transaction')}
                className="text-primary-foreground hover:bg-white/20"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <TransactionListSkeleton count={6} />
        ) : transactions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <TrendingDown className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking your expenses and income
                </p>
                <Button onClick={() => navigate('/add-transaction')}>
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <div key={date} className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {date}
                </h2>
                <div className="space-y-2">
                  {dateTransactions.map((transaction) => (
                    <Card
                      key={transaction.id}
                      className="p-4 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={cn(
                              'w-12 h-12 rounded-full flex items-center justify-center',
                              transaction.type === 'expense'
                                ? 'bg-accent/20 text-accent'
                                : 'bg-success/20 text-success'
                            )}
                          >
                            {transaction.type === 'expense' ? (
                              <TrendingDown className="w-6 h-6" />
                            ) : (
                              <TrendingUp className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground">
                                {transaction.category}
                              </h3>
                              {transaction.recurring && (
                                <Badge variant="secondary" className="text-xs">
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Recurring
                                </Badge>
                              )}
                              {transaction.receiptUri && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover:bg-muted"
                                  onClick={() => setSelectedReceipt(transaction.receiptUri!)}
                                >
                                  <ImageIcon className="w-3 h-3 mr-1" />
                                  Receipt
                                </Badge>
                              )}
                            </div>
                            {transaction.note && (
                              <p className="text-sm text-muted-foreground truncate">
                                {transaction.note}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p
                              className={cn(
                                'font-bold text-lg',
                                transaction.type === 'expense'
                                  ? 'text-accent'
                                  : 'text-success'
                              )}
                            >
                              {transaction.type === 'expense' ? '-' : '+'}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(transaction.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-3xl">
          {selectedReceipt && (
            <img 
              src={selectedReceipt} 
              alt="Receipt" 
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
