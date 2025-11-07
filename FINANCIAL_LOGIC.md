# Financial Application Logic

## Overview
This document explains the core financial logic of the application, detailing how transactions flow through the system and interact with budgets, savings goals, categories, and reports.

---

## Core Data Types

### 1. Transaction
**Location**: `src/types/index.ts`

The fundamental unit of financial activity in the application.

```typescript
interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number; // stored in cents for precision
  currency: string;
  category: string;
  date: string;
  note?: string;
  receiptUri?: string;
  recurring?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Key Properties**:
- **Amount**: Always stored in cents (e.g., $10.50 = 1050) to avoid floating-point precision issues
- **Type**: Distinguishes between money coming in (income) and going out (expense)
- **Category**: Links to either `EXPENSE_CATEGORIES` or `INCOME_CATEGORIES`
- **Currency**: Supports multi-currency tracking

### 2. Budget
**Location**: `src/types/index.ts`

Tracks spending limits per category per month.

```typescript
interface Budget {
  id: string;
  category: string;
  allocatedAmount: number; // in cents
  spentAmount: number; // in cents, calculated from transactions
  month: string; // YYYY-MM format
  createdAt: string;
  updatedAt: string;
}
```

**Budget Calculation Logic**:
- `spentAmount` is dynamically calculated by filtering transactions:
  - Must be type `'expense'`
  - Must match the budget's `category`
  - Must fall within the budget's `month`
- Warning levels:
  - **Safe**: < 80% spent
  - **Warning**: 80-100% spent
  - **Danger**: > 100% spent (over budget)

### 3. SavingsGoal
**Location**: `src/types/index.ts`

Tracks progress toward financial goals.

```typescript
interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number; // in cents
  currentAmount: number; // in cents, sum of all deposits
  targetDate?: string;
  isReached: boolean;
  deposits: Deposit[];
  createdAt: string;
  updatedAt: string;
}
```

**Goal Progress Logic**:
- `currentAmount` is calculated by summing all `deposits`
- `isReached` is set to `true` when `currentAmount >= targetAmount`
- Progress percentage: `(currentAmount / targetAmount) * 100`

### 4. Note
**Location**: `src/types/index.ts`

Free-form notes that can optionally link to transactions.

```typescript
interface Note {
  id: string;
  content: string;
  date?: string;
  transactionId?: string; // optional link to transaction
  createdAt: string;
  updatedAt: string;
}
```

---

## Data Flow & Relationships

### Transaction Lifecycle

```
1. User creates transaction (AddTransaction.tsx)
   ↓
2. Stored in localStorage (transactionStorage)
   ↓
3. Affects multiple parts of the app:
   ├─→ Budget calculation (if expense)
   ├─→ Reports & Analytics
   ├─→ Dashboard statistics
   └─→ Transaction history
```

### How Transactions Affect Budgets

**File**: `src/pages/Budgets.tsx` (lines 16-38)

When budgets are loaded:
1. Fetch all transactions from storage
2. For each budget:
   ```javascript
   const spent = transactions
     .filter(t => 
       t.type === 'expense' &&
       t.category === budget.category &&
       t.date.startsWith(budget.month)
     )
     .reduce((sum, t) => sum + t.amount, 0);
   ```
3. Update `spentAmount` with calculated value
4. Display progress bar showing `spent / allocated * 100%`

**Budget Status Determination** (lines 41-46):
```javascript
function getWarningLevel(spent: number, allocated: number) {
  const percentage = (spent / allocated) * 100;
  if (percentage >= 100) return 'danger';
  if (percentage >= 80) return 'warning';
  return 'safe';
}
```

### How Savings Goals Work

**File**: `src/pages/GoalDetail.tsx`

When a deposit is added:
1. Create new `Deposit` object
2. Add to goal's `deposits` array
3. Recalculate `currentAmount`:
   ```javascript
   currentAmount = deposits.reduce((sum, d) => sum + d.amount, 0)
   ```
4. Check if goal is reached:
   ```javascript
   isReached = currentAmount >= targetAmount
   ```
5. Update storage and show congratulatory message if reached

**Progress Messages** (based on percentage):
- **0-24%**: "You're just getting started! Every contribution counts."
- **25-49%**: "Great progress! You're a quarter of the way there."
- **50-74%**: "Halfway there! Keep up the momentum."
- **75-99%**: "Almost there! You're so close to your goal."
- **100%+**: "Congratulations! You've reached your goal! 🎉"

---

## Category System

**File**: `src/types/index.ts` (lines 55-72)

### Expense Categories
```typescript
['Food & Dining', 'Transport', 'Shopping', 'Entertainment', 
 'Bills & Utilities', 'Healthcare', 'Education', 'Other']
```

### Income Categories
```typescript
['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
```

**Category Management**: `src/lib/storage.ts` (lines 196-234)
- Categories are customizable
- Stored separately in `localStorage` under `expense_categories` and `income_categories`
- Users can add/remove categories in Settings (`src/pages/ManageCategories.tsx`)
- Budgets are tied to specific expense categories

---

## Storage Architecture

**File**: `src/lib/storage.ts`

All data is persisted in `localStorage` using a consistent pattern:

```javascript
// Storage keys
TRANSACTIONS_KEY = 'transactions'
BUDGETS_KEY = 'budgets'
GOALS_KEY = 'savingsGoals'
NOTES_KEY = 'notes'
USER_PREFERENCES_KEY = 'userPreferences'
EXPENSE_CATEGORIES_KEY = 'expense_categories'
INCOME_CATEGORIES_KEY = 'income_categories'
```

**Storage Pattern**:
```javascript
// Get all items
storage.get<Transaction[]>(TRANSACTIONS_KEY) || []

// Save all items
storage.set(TRANSACTIONS_KEY, transactions)

// Each entity has:
- getAll(): Retrieve all items
- save(items): Overwrite all items
- add(item): Add single item with auto-ID
- update(id, updates): Update specific item
- delete(id): Remove specific item
```

---

## Reports & Analytics

**File**: `src/pages/Reports.tsx`

### Data Aggregation Logic

**Period Filtering** (lines 18-30):
```javascript
function filterByPeriod(transactions, period) {
  const now = new Date();
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    switch(period) {
      case 'daily': return isSameDay(transactionDate, now);
      case 'weekly': return isWithinLastWeek(transactionDate);
      case 'monthly': return isSameMonth(transactionDate, now);
    }
  });
}
```

**Category Breakdown** (lines 32-44):
```javascript
const categoryData = {};
filteredTransactions
  .filter(t => t.type === 'expense')
  .forEach(t => {
    categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
  });
```

**Key Metrics Calculated**:
1. **Total Income**: Sum of all income transactions
2. **Total Expenses**: Sum of all expense transactions
3. **Net Balance**: Income - Expenses
4. **Top Categories**: Sorted by spending amount (descending)
5. **Transaction Count**: Total number of transactions
6. **Average per Day**: Total expenses / days in period

---

## Dashboard Statistics

**File**: `src/pages/Dashboard.tsx`

The dashboard aggregates data from multiple sources:

### Monthly Overview (lines 45-70)
```javascript
// Filter transactions for current month
const thisMonthTransactions = transactions.filter(t => 
  t.date.startsWith(currentMonth)
);

// Calculate totals
const income = thisMonthTransactions
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + t.amount, 0);

const expenses = thisMonthTransactions
  .filter(t => t.type === 'expense')
  .reduce((sum, t) => sum + t.amount, 0);

const balance = income - expenses;
```

### Budget Progress
Shows budgets for current month with calculated spending percentages.

### Recent Transactions
Displays last 5 transactions across all categories.

### Savings Goals Progress
Shows all active goals with progress bars and motivational messages.

---

## Import/Export System

**File**: `src/lib/export.ts`

### Export Formats

**1. JSON Export**:
```javascript
exportToJSON(data, filename)
// Creates downloadable .json file with complete data structure
```

**2. CSV Export**:
- Transactions: ID, Date, Type, Category, Amount, Currency, Note, Recurring
- Budgets: ID, Month, Category, Allocated, Spent
- Goals: ID, Title, Target, Current, Progress%, Target Date, Status

**3. Complete Backup**:
```javascript
exportAllData(transactions, budgets, goals)
// Single JSON file with all application data
```

### Import System

**File**: `src/pages/ImportStatement.tsx`

Supports importing bank statements:

**CSV Format**:
1. Parse CSV rows
2. Detect date, description, amount columns
3. Auto-categorize based on description keywords
4. Determine if expense or income based on amount sign
5. Convert to Transaction objects

**PDF Format**:
1. Extract text from PDF
2. Use regex to find date and amount patterns
3. Parse into transaction format
4. Same categorization logic as CSV

**Categorization Logic** (`src/lib/statementParser.ts` lines 84-141):
```javascript
// Keyword matching for auto-categorization
if (description.includes('restaurant') || description.includes('food')) {
  return 'Food & Dining';
}
if (description.includes('uber') || description.includes('taxi')) {
  return 'Transport';
}
// ... etc
```

---

## Data Integrity & Consistency

### Amount Storage
- **All amounts in cents**: Prevents floating-point errors
- **Conversion**: `$10.50 → 1050 cents`
- **Display**: `formatCurrency(1050) → "$10.50"`

### Date Handling
- **Storage format**: ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Month format**: `YYYY-MM` for budgets
- **Comparison**: Use `startsWith()` for month matching

### ID Generation
```javascript
id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
// Ensures uniqueness across all entities
```

### Timestamp Tracking
Every entity has:
- `createdAt`: Set once on creation
- `updatedAt`: Updated on every modification

---

## Currency Support

**File**: `src/lib/currency.ts`

The app supports multi-currency with user preference:

```javascript
// User's preferred currency stored in localStorage
userStorage.getCurrency() // e.g., 'USD', 'EUR', 'GBP'

// All amounts still in cents, currency is display-only
formatCurrency(1050, 'USD') → "$10.50"
formatCurrency(1050, 'EUR') → "€10.50"
```

---

## Summary: Transaction Impact Map

When a transaction is created:

```
Transaction Created
    │
    ├─→ Stored in localStorage
    │
    ├─→ If EXPENSE:
    │   ├─→ Affects budget spentAmount (if category matches)
    │   ├─→ Increases total expenses in Dashboard
    │   └─→ Counted in Reports category breakdown
    │
    ├─→ If INCOME:
    │   ├─→ Increases total income in Dashboard
    │   └─→ Counted in Reports income total
    │
    ├─→ Appears in:
    │   ├─→ Transactions page (sorted by date)
    │   ├─→ Dashboard (recent transactions)
    │   └─→ Reports (filtered by period)
    │
    └─→ Can be linked to:
        ├─→ Note (via transactionId)
        └─→ Receipt image (via receiptUri)
```

---

## Best Practices

1. **Always use cents for calculations**: Convert to dollars only for display
2. **Filter before aggregating**: Filter transactions by type/category/date before summing
3. **Recalculate on load**: Budget spending is always recalculated from transactions, never stored
4. **Validate categories**: Ensure categories exist before creating transactions or budgets
5. **Date consistency**: Always use ISO format for storage, format for display
6. **ID uniqueness**: Use timestamp + random for all IDs
7. **Update timestamps**: Always update `updatedAt` on modifications

---

## Future Considerations

This architecture supports potential enhancements:
- Multi-user support (user IDs on all entities)
- Backend sync (replace localStorage with API calls)
- Advanced reporting (trends, predictions)
- Budget templates (recurring budget creation)
- Automated savings (transaction → goal deposit linking)
- Split transactions (multiple categories)
- Tags/labels (additional transaction metadata)
