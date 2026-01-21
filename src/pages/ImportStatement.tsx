import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabaseTransactionStorage } from '@/lib/supabase-storage';
import { useAuth } from '@/hooks/useAuth';
import { parseCSVStatement, parsePDFStatement, convertToTransactions, ParsedTransaction } from '@/lib/statementParser';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

const ImportStatement = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileType = selectedFile.name.toLowerCase();
    if (!fileType.endsWith('.csv') && !fileType.endsWith('.pdf')) {
      toast.error('Please upload a CSV or PDF file');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setParsedTransactions([]);
    setSelectedTransactions(new Set());

    try {
      if (fileType.endsWith('.csv')) {
        const text = await selectedFile.text();
        const transactions = parseCSVStatement(text);
        setParsedTransactions(transactions);
        // Select all by default
        setSelectedTransactions(new Set(transactions.map((_, i) => i)));
        toast.success(`Found ${transactions.length} transactions`);
      } else if (fileType.endsWith('.pdf')) {
        // For PDF, we'd need to parse it differently
        // This is a simplified version - in reality you'd use the parse_document tool
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = event.target?.result as string;
          const transactions = parsePDFStatement(text);
          setParsedTransactions(transactions);
          setSelectedTransactions(new Set(transactions.map((_, i) => i)));
          toast.success(`Found ${transactions.length} transactions`);
        };
        reader.readAsText(selectedFile);
      }
    } catch (error) {
      toast.error('Error parsing file. Please check the format.');
      console.error('Parse error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTransaction = (index: number) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAll = () => {
    if (selectedTransactions.size === parsedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(parsedTransactions.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    const selectedTxns = parsedTransactions.filter((_, i) => selectedTransactions.has(i));
    const currency = profile?.currency || 'ZAR';
    const transactions = convertToTransactions(selectedTxns, currency);
    
    setIsImporting(true);
    try {
      for (const txn of transactions) {
        await supabaseTransactionStorage.add(txn);
      }
      toast.success(`Imported ${transactions.length} transactions`);
      navigate('/transactions');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import transactions');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/transactions')}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Import Bank Statement</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Upload Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="statement">Bank Statement (CSV or PDF)</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="statement"
                  className="flex-1 flex items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : 'Click to upload CSV or PDF'}
                  </span>
                </label>
                <input
                  id="statement"
                  type="file"
                  accept=".csv,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: CSV (comma or semicolon separated), PDF bank statements
              </p>
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing file...
              </div>
            )}
          </CardContent>
        </Card>

        {parsedTransactions.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Review Transactions</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAll}
                >
                  {selectedTransactions.size === parsedTransactions.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {parsedTransactions.map((txn, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedTransactions.has(index)}
                      onCheckedChange={() => toggleTransaction(index)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{txn.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(txn.date).toLocaleDateString()} • {txn.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${txn.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                            {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedTransactions.size} of {parsedTransactions.length} selected
                </div>
                <Button
                  onClick={handleImport}
                  disabled={selectedTransactions.size === 0 || isImporting}
                  className="gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Import {selectedTransactions.size} Transaction{selectedTransactions.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {parsedTransactions.length === 0 && file && !isProcessing && (
          <Card className="shadow-md border-warning">
            <CardContent className="flex items-center gap-3 p-6">
              <AlertCircle className="w-8 h-8 text-warning flex-shrink-0" />
              <div>
                <p className="font-medium">No transactions found</p>
                <p className="text-sm text-muted-foreground">
                  The file format might not be recognized. Please ensure your CSV has date, description, and amount columns,
                  or your PDF is a standard bank statement.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ImportStatement;
