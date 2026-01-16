import { supabase } from '@/integrations/supabase/client';
import type { Transaction, Budget, SavingsGoal, Note, BudgetTemplate, Deposit } from '@/types';

// Helper to get current user ID
const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
};

// Convert cents to decimal for display (database stores in cents)
const centsToDecimal = (cents: number): number => cents / 100;
const decimalToCents = (decimal: number): number => Math.round(decimal * 100);

// Transaction operations
export const supabaseTransactionStorage = {
  getAll: async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map((t) => ({
      id: t.id,
      type: t.type as 'expense' | 'income',
      amount: centsToDecimal(t.amount),
      currency: t.currency,
      category: t.category,
      date: t.date,
      note: t.note || undefined,
      receiptUri: t.receipt_uri || undefined,
      recurring: t.recurring || false,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  },

  add: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: transaction.type,
        amount: decimalToCents(transaction.amount),
        currency: transaction.currency,
        category: transaction.category,
        date: transaction.date,
        note: transaction.note,
        receipt_uri: transaction.receiptUri,
        recurring: transaction.recurring,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: data.type as 'expense' | 'income',
      amount: centsToDecimal(data.amount),
      currency: data.currency,
      category: data.category,
      date: data.date,
      note: data.note || undefined,
      receiptUri: data.receipt_uri || undefined,
      recurring: data.recurring || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  update: async (id: string, updates: Partial<Transaction>): Promise<void> => {
    const updateData: Record<string, unknown> = {};
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.amount !== undefined) updateData.amount = decimalToCents(updates.amount);
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.note !== undefined) updateData.note = updates.note;
    if (updates.receiptUri !== undefined) updateData.receipt_uri = updates.receiptUri;
    if (updates.recurring !== undefined) updateData.recurring = updates.recurring;

    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Budget operations
export const supabaseBudgetStorage = {
  getAll: async (): Promise<Budget[]> => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('month', { ascending: false });

    if (error) throw error;

    // spentAmount is calculated from transactions, not stored in budgets table
    return (data || []).map((b) => ({
      id: b.id,
      category: b.category,
      allocatedAmount: centsToDecimal(b.allocated_amount),
      spentAmount: 0, // Will be calculated separately from transactions
      month: b.month,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));
  },

  add: async (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'spentAmount'>): Promise<Budget> => {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: userId,
        category: budget.category,
        allocated_amount: decimalToCents(budget.allocatedAmount),
        month: budget.month,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      category: data.category,
      allocatedAmount: centsToDecimal(data.allocated_amount),
      spentAmount: 0,
      month: data.month,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  update: async (id: string, updates: Partial<Budget>): Promise<void> => {
    const updateData: Record<string, unknown> = {};
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.allocatedAmount !== undefined) updateData.allocated_amount = decimalToCents(updates.allocatedAmount);
    if (updates.month !== undefined) updateData.month = updates.month;

    const { error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Savings goal operations
export const supabaseGoalStorage = {
  getAll: async (): Promise<SavingsGoal[]> => {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((g) => ({
      id: g.id,
      title: g.title,
      targetAmount: centsToDecimal(g.target_amount),
      currentAmount: centsToDecimal(g.current_amount || 0),
      targetDate: g.target_date || undefined,
      isReached: g.is_reached || false,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
      deposits: [], // Will be loaded separately if needed
    }));
  },

  getById: async (id: string): Promise<SavingsGoal | null> => {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Fetch deposits for this goal
    const { data: deposits } = await supabase
      .from('deposits')
      .select('*')
      .eq('goal_id', id)
      .order('date', { ascending: false });

    return {
      id: data.id,
      title: data.title,
      targetAmount: centsToDecimal(data.target_amount),
      currentAmount: centsToDecimal(data.current_amount || 0),
      targetDate: data.target_date || undefined,
      isReached: data.is_reached || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deposits: (deposits || []).map((d) => ({
        id: d.id,
        amount: centsToDecimal(d.amount),
        date: d.date,
        note: d.note || undefined,
      })),
    };
  },

  add: async (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'isReached' | 'deposits'>): Promise<SavingsGoal> => {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: userId,
        title: goal.title,
        target_amount: decimalToCents(goal.targetAmount),
        target_date: goal.targetDate,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      targetAmount: centsToDecimal(data.target_amount),
      currentAmount: 0,
      targetDate: data.target_date || undefined,
      isReached: false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deposits: [],
    };
  },

  update: async (id: string, updates: Partial<SavingsGoal>): Promise<void> => {
    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.targetAmount !== undefined) updateData.target_amount = decimalToCents(updates.targetAmount);
    if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate;

    const { error } = await supabase
      .from('savings_goals')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  addDeposit: async (goalId: string, deposit: Omit<Deposit, 'id'>): Promise<Deposit> => {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('deposits')
      .insert({
        goal_id: goalId,
        user_id: userId,
        amount: decimalToCents(deposit.amount),
        date: deposit.date,
        note: deposit.note,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      amount: centsToDecimal(data.amount),
      date: data.date,
      note: data.note || undefined,
    };
  },
};

// Note operations
export const supabaseNoteStorage = {
  getAll: async (): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((n) => ({
      id: n.id,
      content: n.content,
      date: n.date || undefined,
      transactionId: n.transaction_id || undefined,
      budgetId: n.budget_id || undefined,
      goalId: n.goal_id || undefined,
      isTodo: n.is_todo || false,
      isCompleted: n.is_completed || false,
      dueDate: n.due_date || undefined,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }));
  },

  add: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        content: note.content,
        date: note.date,
        transaction_id: note.transactionId,
        budget_id: note.budgetId,
        goal_id: note.goalId,
        is_todo: note.isTodo,
        is_completed: note.isCompleted,
        due_date: note.dueDate,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      content: data.content,
      date: data.date || undefined,
      transactionId: data.transaction_id || undefined,
      budgetId: data.budget_id || undefined,
      goalId: data.goal_id || undefined,
      isTodo: data.is_todo || false,
      isCompleted: data.is_completed || false,
      dueDate: data.due_date || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  update: async (id: string, updates: Partial<Note>): Promise<void> => {
    const updateData: Record<string, unknown> = {};
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.transactionId !== undefined) updateData.transaction_id = updates.transactionId;
    if (updates.budgetId !== undefined) updateData.budget_id = updates.budgetId;
    if (updates.goalId !== undefined) updateData.goal_id = updates.goalId;
    if (updates.isTodo !== undefined) updateData.is_todo = updates.isTodo;
    if (updates.isCompleted !== undefined) updateData.is_completed = updates.isCompleted;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;

    const { error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Budget template operations
export const supabaseBudgetTemplateStorage = {
  getAll: async (): Promise<BudgetTemplate[]> => {
    const { data, error } = await supabase
      .from('budget_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((t) => ({
      id: t.id,
      name: t.name,
      budgets: (t.budgets as Array<{ category: string; allocatedAmount: number }>).map((b) => ({
        category: b.category,
        allocatedAmount: centsToDecimal(b.allocatedAmount),
      })),
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  },

  add: async (template: Omit<BudgetTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<BudgetTemplate> => {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('budget_templates')
      .insert({
        user_id: userId,
        name: template.name,
        budgets: template.budgets.map((b) => ({
          category: b.category,
          allocatedAmount: decimalToCents(b.allocatedAmount),
        })),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      budgets: (data.budgets as Array<{ category: string; allocatedAmount: number }>).map((b) => ({
        category: b.category,
        allocatedAmount: centsToDecimal(b.allocatedAmount),
      })),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  update: async (id: string, updates: Partial<BudgetTemplate>): Promise<void> => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.budgets !== undefined) {
      updateData.budgets = updates.budgets.map((b) => ({
        category: b.category,
        allocatedAmount: decimalToCents(b.allocatedAmount),
      }));
    }

    const { error } = await supabase
      .from('budget_templates')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('budget_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// User preferences operations
export const supabaseUserStorage = {
  getProfile: async () => {
    const userId = await getUserId();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  updateProfile: async (updates: { full_name?: string; currency?: string; avatar_url?: string }) => {
    const userId = await getUserId();
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  },

  getPreferences: async () => {
    const userId = await getUserId();
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  updatePreferences: async (updates: { color_theme?: unknown; streak_data?: unknown; calculator_value?: string }) => {
    const userId = await getUserId();
    
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    const updatePayload: Record<string, unknown> = {};
    if (updates.color_theme !== undefined) updatePayload.color_theme = updates.color_theme;
    if (updates.streak_data !== undefined) updatePayload.streak_data = updates.streak_data;
    if (updates.calculator_value !== undefined) updatePayload.calculator_value = updates.calculator_value;

    if (existing) {
      const { error } = await supabase
        .from('user_preferences')
        .update(updatePayload)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_preferences')
        .insert([{ user_id: userId, ...updatePayload }]);
      if (error) throw error;
    }
  },
};

// Category operations
export const supabaseCategoryStorage = {
  getCategories: async (type: 'expense' | 'income'): Promise<string[]> => {
    const userId = await getUserId();
    
    const { data, error } = await supabase
      .from('custom_categories')
      .select('categories')
      .eq('user_id', userId)
      .eq('type', type)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    const defaults = type === 'expense'
      ? ['Food & Dining', 'Transport', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Other']
      : ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

    return data?.categories || defaults;
  },

  setCategories: async (type: 'expense' | 'income', categories: string[]): Promise<void> => {
    const userId = await getUserId();
    
    const { data: existing } = await supabase
      .from('custom_categories')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('custom_categories')
        .update({ categories })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('custom_categories')
        .insert({ user_id: userId, type, categories });
      if (error) throw error;
    }
  },

  addCategory: async (type: 'expense' | 'income', category: string): Promise<void> => {
    const categories = await supabaseCategoryStorage.getCategories(type);
    if (!categories.includes(category)) {
      categories.push(category);
      await supabaseCategoryStorage.setCategories(type, categories);
    }
  },

  removeCategory: async (type: 'expense' | 'income', category: string): Promise<void> => {
    const categories = await supabaseCategoryStorage.getCategories(type);
    const filtered = categories.filter((c) => c !== category);
    await supabaseCategoryStorage.setCategories(type, filtered);
  },
};
