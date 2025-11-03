import { Transaction } from '@/types';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category?: string;
}

// Parse CSV bank statement
export const parseCSVStatement = (csvContent: string): ParsedTransaction[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return [];

  // Try to detect headers
  const firstLine = lines[0].toLowerCase();
  const hasHeaders = firstLine.includes('date') || firstLine.includes('description') || firstLine.includes('amount');
  
  const dataLines = hasHeaders ? lines.slice(1) : lines;
  const transactions: ParsedTransaction[] = [];

  for (const line of dataLines) {
    // Handle both comma and semicolon separators
    const separator = line.includes(';') ? ';' : ',';
    const fields = line.split(separator).map(f => f.trim().replace(/^["']|["']$/g, ''));
    
    if (fields.length < 3) continue;

    // Try to parse the transaction
    const parsed = parseTransactionFields(fields);
    if (parsed) {
      transactions.push(parsed);
    }
  }

  return transactions;
};

// Helper to parse transaction from fields
const parseTransactionFields = (fields: string[]): ParsedTransaction | null => {
  let date = '';
  let description = '';
  let amount = 0;

  // Try different field arrangements
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    
    // Try to parse as date
    if (!date && isDate(field)) {
      date = normalizeDate(field);
    }
    
    // Try to parse as amount
    if (isAmount(field)) {
      amount = parseAmount(field);
    }
    
    // Collect description from non-date, non-amount fields
    if (!isDate(field) && !isAmount(field) && field) {
      description = description ? `${description} ${field}` : field;
    }
  }

  if (!date || !description || amount === 0) return null;

  return {
    date,
    description: description.trim(),
    amount: Math.abs(amount),
    type: amount < 0 ? 'expense' : 'income',
    category: categorizeTransaction(description),
  };
};

// Check if string is a date
const isDate = (str: string): boolean => {
  // Check various date formats
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/,   // DD-MM-YYYY
    /^\d{1,2}\s+\w+\s+\d{4}$/, // DD Month YYYY
  ];
  
  return datePatterns.some(pattern => pattern.test(str));
};

// Normalize date to ISO format
const normalizeDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    // Try DD/MM/YYYY format
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const [first, second, third] = parts;
      // Assume DD/MM/YYYY if first part is <= 31
      if (parseInt(first) <= 31) {
        return new Date(`${third}-${second}-${first}`).toISOString();
      }
    }
  }
  return date.toISOString();
};

// Check if string is an amount
const isAmount = (str: string): boolean => {
  const cleaned = str.replace(/[,\s]/g, '').replace(/[R$€£¥]/g, '');
  return /^-?\d+\.?\d*$/.test(cleaned);
};

// Parse amount from string
const parseAmount = (str: string): number => {
  const cleaned = str.replace(/[,\s]/g, '').replace(/[R$€£¥]/g, '');
  return parseFloat(cleaned) * 100; // Convert to cents
};

// Auto-categorize based on description
const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase();
  
  const categories: Record<string, string[]> = {
    'Food & Dining': ['restaurant', 'cafe', 'coffee', 'food', 'grocery', 'supermarket', 'pizza', 'uber eats', 'doordash'],
    'Transport': ['uber', 'taxi', 'gas', 'fuel', 'parking', 'toll', 'train', 'bus', 'metro'],
    'Shopping': ['amazon', 'shop', 'store', 'mall', 'clothing', 'retail'],
    'Entertainment': ['netflix', 'spotify', 'movie', 'cinema', 'game', 'steam', 'entertainment'],
    'Bills & Utilities': ['electric', 'water', 'internet', 'phone', 'insurance', 'rent', 'mortgage'],
    'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'health', 'clinic'],
    'Salary': ['salary', 'payroll', 'wage', 'income'],
    'Transfer': ['transfer', 'atm', 'withdrawal', 'deposit'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return category;
    }
  }

  return 'Other';
};

// Parse PDF content (from document parser)
export const parsePDFStatement = (pdfText: string): ParsedTransaction[] => {
  const lines = pdfText.split('\n').map(l => l.trim()).filter(l => l);
  const transactions: ParsedTransaction[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for date patterns at the start of lines
    const dateMatch = line.match(/^(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/);
    if (!dateMatch) continue;

    const date = normalizeDate(dateMatch[1]);
    
    // Extract amount - look for numbers with currency symbols or just numbers
    const amountMatch = line.match(/[R$€£¥]?\s*-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g);
    if (!amountMatch || amountMatch.length === 0) continue;

    // Usually the last number in the line is the balance, second-to-last is the amount
    const amounts = amountMatch.map(a => parseAmount(a));
    const amount = amounts.length > 1 ? amounts[amounts.length - 2] : amounts[0];

    // Extract description (text between date and amount)
    const description = line
      .replace(dateMatch[0], '')
      .replace(amountMatch[amountMatch.length - 1], '')
      .replace(amountMatch.length > 1 ? amountMatch[amountMatch.length - 2] : '', '')
      .trim();

    if (description && amount !== 0) {
      transactions.push({
        date,
        description,
        amount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        category: categorizeTransaction(description),
      });
    }
  }

  return transactions;
};

// Convert parsed transactions to app transactions
export const convertToTransactions = (
  parsedTransactions: ParsedTransaction[],
  currency: string
): Transaction[] => {
  return parsedTransactions.map(pt => ({
    id: crypto.randomUUID(),
    type: pt.type,
    amount: pt.amount,
    currency,
    category: pt.category || 'Other',
    date: pt.date,
    note: pt.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};
