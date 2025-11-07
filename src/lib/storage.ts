import { Transaction, Budget, SavingsGoal, Note, BudgetTemplate } from '@/types';

// LocalStorage keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'mymani_transactions',
  BUDGETS: 'mymani_budgets',
  GOALS: 'mymani_goals',
  NOTES: 'mymani_notes',
  CALCULATOR_VALUE: 'mymani_calculator_value',
  USER_NAME: 'mymani_user_name',
  CURRENCY: 'mymani_currency',
  EXPENSE_CATEGORIES: 'mymani_expense_categories',
  INCOME_CATEGORIES: 'mymani_income_categories',
} as const;

// Generic storage functions
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  },
};

// Transaction operations
export const transactionStorage = {
  getAll: (): Transaction[] => storage.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [],
  
  save: (transactions: Transaction[]): void => {
    storage.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  },
  
  add: (transaction: Transaction): void => {
    const transactions = transactionStorage.getAll();
    transactions.push(transaction);
    transactionStorage.save(transactions);
  },
  
  update: (id: string, updates: Partial<Transaction>): void => {
    const transactions = transactionStorage.getAll();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates, updatedAt: new Date().toISOString() };
      transactionStorage.save(transactions);
    }
  },
  
  delete: (id: string): void => {
    const transactions = transactionStorage.getAll();
    transactionStorage.save(transactions.filter(t => t.id !== id));
  },
};

// Budget operations
export const budgetStorage = {
  getAll: (): Budget[] => storage.get<Budget[]>(STORAGE_KEYS.BUDGETS) || [],
  
  save: (budgets: Budget[]): void => {
    storage.set(STORAGE_KEYS.BUDGETS, budgets);
  },
  
  add: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): void => {
    const budgets = budgetStorage.getAll();
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    budgets.push(newBudget);
    budgetStorage.save(budgets);
  },
  
  update: (id: string, updates: Partial<Budget>): void => {
    const budgets = budgetStorage.getAll();
    const index = budgets.findIndex(b => b.id === id);
    if (index !== -1) {
      budgets[index] = { ...budgets[index], ...updates, updatedAt: new Date().toISOString() };
      budgetStorage.save(budgets);
    }
  },
  
  delete: (id: string): void => {
    const budgets = budgetStorage.getAll();
    budgetStorage.save(budgets.filter(b => b.id !== id));
  },
};

// Savings goal operations
export const goalStorage = {
  getAll: (): SavingsGoal[] => storage.get<SavingsGoal[]>(STORAGE_KEYS.GOALS) || [],
  
  save: (goals: SavingsGoal[]): void => {
    storage.set(STORAGE_KEYS.GOALS, goals);
  },
  
  add: (goal: SavingsGoal): void => {
    const goals = goalStorage.getAll();
    goals.push(goal);
    goalStorage.save(goals);
  },
  
  update: (id: string, updates: Partial<SavingsGoal>): void => {
    const goals = goalStorage.getAll();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...updates, updatedAt: new Date().toISOString() };
      goalStorage.save(goals);
    }
  },
  
  delete: (id: string): void => {
    const goals = goalStorage.getAll();
    goalStorage.save(goals.filter(g => g.id !== id));
  },
};

// Note operations
export const noteStorage = {
  getAll: (): Note[] => storage.get<Note[]>(STORAGE_KEYS.NOTES) || [],
  
  save: (notes: Note[]): void => {
    storage.set(STORAGE_KEYS.NOTES, notes);
  },
  
  add: (note: Note): void => {
    const notes = noteStorage.getAll();
    notes.push(note);
    noteStorage.save(notes);
  },
  
  update: (id: string, updates: Partial<Note>): void => {
    const notes = noteStorage.getAll();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...updates, updatedAt: new Date().toISOString() };
      noteStorage.save(notes);
    }
  },
  
  delete: (id: string): void => {
    const notes = noteStorage.getAll();
    noteStorage.save(notes.filter(n => n.id !== id));
  },
};

// Calculator value
export const calculatorStorage = {
  getValue: (): string => storage.get<string>(STORAGE_KEYS.CALCULATOR_VALUE) || '0',
  setValue: (value: string): void => storage.set(STORAGE_KEYS.CALCULATOR_VALUE, value),
};

// User preferences
export const userStorage = {
  getName: (): string => storage.get<string>(STORAGE_KEYS.USER_NAME) || 'there',
  setName: (name: string): void => storage.set(STORAGE_KEYS.USER_NAME, name),
  
  getCurrency: (): string => storage.get<string>(STORAGE_KEYS.CURRENCY) || 'ZAR',
  setCurrency: (currency: string): void => storage.set(STORAGE_KEYS.CURRENCY, currency),
};

// Category management
const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Other',
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Other',
];

export const categoryStorage = {
  getExpenseCategories: (): string[] => 
    storage.get<string[]>(STORAGE_KEYS.EXPENSE_CATEGORIES) || DEFAULT_EXPENSE_CATEGORIES,
  
  setExpenseCategories: (categories: string[]): void => 
    storage.set(STORAGE_KEYS.EXPENSE_CATEGORIES, categories),
  
  getIncomeCategories: (): string[] => 
    storage.get<string[]>(STORAGE_KEYS.INCOME_CATEGORIES) || DEFAULT_INCOME_CATEGORIES,
  
  setIncomeCategories: (categories: string[]): void => 
    storage.set(STORAGE_KEYS.INCOME_CATEGORIES, categories),
  
  addExpenseCategory: (category: string): void => {
    const categories = categoryStorage.getExpenseCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      categoryStorage.setExpenseCategories(categories);
    }
  },
  
  addIncomeCategory: (category: string): void => {
    const categories = categoryStorage.getIncomeCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      categoryStorage.setIncomeCategories(categories);
    }
  },
  
  removeExpenseCategory: (category: string): void => {
    const categories = categoryStorage.getExpenseCategories().filter(c => c !== category);
    categoryStorage.setExpenseCategories(categories);
  },
  
  removeIncomeCategory: (category: string): void => {
    const categories = categoryStorage.getIncomeCategories().filter(c => c !== category);
    categoryStorage.setIncomeCategories(categories);
  },
};

// Budget Template Storage
export const budgetTemplateStorage = {
  getAll: (): BudgetTemplate[] => {
    return storage.get<BudgetTemplate[]>('budgetTemplates') || [];
  },
  
  save: (templates: BudgetTemplate[]) => {
    storage.set('budgetTemplates', templates);
  },
  
  add: (template: Omit<BudgetTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const templates = budgetTemplateStorage.getAll();
    const newTemplate: BudgetTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    budgetTemplateStorage.save(templates);
    return newTemplate;
  },
  
  update: (id: string, updates: Partial<BudgetTemplate>) => {
    const templates = budgetTemplateStorage.getAll();
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
      templates[index] = {
        ...templates[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      budgetTemplateStorage.save(templates);
    }
  },
  
  delete: (id: string) => {
    const templates = budgetTemplateStorage.getAll();
    const filtered = templates.filter(t => t.id !== id);
    budgetTemplateStorage.save(filtered);
  },
};
