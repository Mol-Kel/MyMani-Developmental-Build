import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, BookOpen, Edit, CheckSquare, Square, Calendar, Link2, TrendingUp, Target, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserMenu } from '@/components/UserMenu';
import { NoteCardSkeleton } from '@/components/skeletons';
import { supabaseNoteStorage, supabaseTransactionStorage, supabaseBudgetStorage, supabaseGoalStorage } from '@/lib/supabase-storage';
import { Note, Transaction, Budget, SavingsGoal } from '@/types';
import { formatDate } from '@/lib/formatters';
import { getUrgencyInfo } from '@/lib/dateHelpers';
import { toast } from 'sonner';

const Notes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isTodo, setIsTodo] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [linkedType, setLinkedType] = useState<'none' | 'transaction' | 'budget' | 'goal'>('none');
  const [linkedId, setLinkedId] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'notes' | 'todos' | 'completed' | 'incomplete'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allNotes, allTransactions, allBudgets, allGoals] = await Promise.all([
        supabaseNoteStorage.getAll(),
        supabaseTransactionStorage.getAll(),
        supabaseBudgetStorage.getAll(),
        supabaseGoalStorage.getAll(),
      ]);
      
      const sorted = allNotes.sort((a, b) => 
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );
      setNotes(sorted);
      setTransactions(allTransactions);
      setBudgets(allBudgets);
      setGoals(allGoals);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!noteContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    try {
      const noteData = {
        content: noteContent.trim(),
        isTodo,
        isCompleted: editingNote?.isCompleted || false,
        dueDate: isTodo && dueDate ? dueDate : undefined,
        transactionId: linkedType === 'transaction' ? linkedId : undefined,
        budgetId: linkedType === 'budget' ? linkedId : undefined,
        goalId: linkedType === 'goal' ? linkedId : undefined,
      };

      if (editingNote) {
        await supabaseNoteStorage.update(editingNote.id, noteData);
        toast.success('Note updated');
      } else {
        await supabaseNoteStorage.add(noteData);
        toast.success('Note added');
      }

      handleDialogClose();
      await loadData();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingNote(null);
    setNoteContent('');
    setIsTodo(false);
    setDueDate('');
    setLinkedType('none');
    setLinkedId('');
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setIsTodo(note.isTodo || false);
    setDueDate(note.dueDate || '');
    
    if (note.transactionId) {
      setLinkedType('transaction');
      setLinkedId(note.transactionId);
    } else if (note.budgetId) {
      setLinkedType('budget');
      setLinkedId(note.budgetId);
    } else if (note.goalId) {
      setLinkedType('goal');
      setLinkedId(note.goalId);
    } else {
      setLinkedType('none');
      setLinkedId('');
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await supabaseNoteStorage.delete(id);
        await loadData();
        toast.success('Note deleted');
      } catch (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
      }
    }
  };

  const handleAddNew = () => {
    handleDialogClose();
    setIsDialogOpen(true);
  };

  const handleToggleComplete = async (note: Note) => {
    try {
      await supabaseNoteStorage.update(note.id, {
        isCompleted: !note.isCompleted,
      });
      await loadData();
      toast.success(note.isCompleted ? 'Todo unchecked' : 'Todo completed');
    } catch (error) {
      console.error('Error toggling note:', error);
      toast.error('Failed to update note');
    }
  };

  const getLinkedItem = (note: Note) => {
    if (note.transactionId) {
      const transaction = transactions.find(t => t.id === note.transactionId);
      return transaction ? { type: 'transaction', item: transaction } : null;
    }
    if (note.budgetId) {
      const budget = budgets.find(b => b.id === note.budgetId);
      return budget ? { type: 'budget', item: budget } : null;
    }
    if (note.goalId) {
      const goal = goals.find(g => g.id === note.goalId);
      return goal ? { type: 'goal', item: goal } : null;
    }
    return null;
  };

  const filteredNotes = notes.filter(note => {
    if (filterType === 'all') return true;
    if (filterType === 'notes') return !note.isTodo;
    if (filterType === 'todos') return note.isTodo;
    if (filterType === 'completed') return note.isTodo && note.isCompleted;
    if (filterType === 'incomplete') return note.isTodo && !note.isCompleted;
    return true;
  });

  const linkedItems = linkedType === 'transaction' ? transactions :
                      linkedType === 'budget' ? budgets :
                      linkedType === 'goal' ? goals : [];

  return (
    <div className="min-h-screen bg-background">
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
              <h1 className="text-xl font-bold">Notes</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddNew}
                className="text-primary-foreground hover:bg-white/20"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="incomplete">Active</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <NoteCardSkeleton count={4} />
        ) : filteredNotes.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {notes.length === 0 
                    ? 'Start writing down your thoughts and ideas'
                    : 'Try a different filter'}
                </p>
                {notes.length === 0 && (
                  <Button onClick={handleAddNew}>
                    <Plus className="w-4 h-4" />
                    Add Note
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note) => {
              const linkedItem = getLinkedItem(note);
              const urgency = note.isTodo ? getUrgencyInfo(note.dueDate) : null;
              
              return (
                <Card key={note.id} className="p-4 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {note.isTodo && (
                        <button
                          onClick={() => handleToggleComplete(note)}
                          className="mt-1 shrink-0"
                        >
                          {note.isCompleted ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                      )}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(note.createdAt!)}
                          </p>
                          {note.isTodo && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Todo
                            </span>
                          )}
                          {urgency && urgency.level !== 'none' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${urgency.bgColor} ${urgency.color} flex items-center gap-1`}>
                              <Calendar className="w-3 h-3" />
                              {urgency.label}
                            </span>
                          )}
                        </div>
                        <p className={`text-foreground whitespace-pre-wrap break-words ${note.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {note.content}
                        </p>
                        {linkedItem && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded px-2 py-1.5 w-fit">
                            <Link2 className="w-3.5 h-3.5" />
                            {linkedItem.type === 'transaction' && (
                              <>
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Transaction: {(linkedItem.item as Transaction).category}</span>
                              </>
                            )}
                            {linkedItem.type === 'budget' && (
                              <>
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>Budget: {(linkedItem.item as Budget).category}</span>
                              </>
                            )}
                            {linkedItem.type === 'goal' && (
                              <>
                                <Target className="w-3.5 h-3.5" />
                                <span>Goal: {(linkedItem.item as SavingsGoal).title}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(note)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(note.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="todo-mode"
                checked={isTodo}
                onCheckedChange={setIsTodo}
              />
              <Label htmlFor="todo-mode">
                Mark as todo
              </Label>
            </div>
            
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={isTodo ? "What needs to be done?" : "Write your note here..."}
              className="min-h-[120px]"
              autoFocus
            />

            {isTodo && (
              <div className="space-y-2">
                <Label htmlFor="due-date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date (Optional)
                </Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Link to Item (Optional)
              </Label>
              <Select value={linkedType} onValueChange={(v: typeof linkedType) => {
                setLinkedType(v);
                setLinkedId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="transaction">Transaction</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="goal">Savings Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {linkedType !== 'none' && linkedItems.length > 0 && (
              <div className="space-y-2">
                <Label>Select {linkedType}</Label>
                <Select value={linkedId} onValueChange={setLinkedId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose a ${linkedType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedItems.map((item) => {
                      let displayText = '';
                      if (linkedType === 'transaction') {
                        const t = item as Transaction;
                        displayText = `${t.category} - ${formatDate(t.date)}`;
                      } else if (linkedType === 'budget') {
                        const b = item as Budget;
                        displayText = `${b.category} - ${b.month}`;
                      } else if (linkedType === 'goal') {
                        const g = item as SavingsGoal;
                        displayText = g.title;
                      }
                      
                      return (
                        <SelectItem key={item.id} value={item.id}>
                          {displayText}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {linkedType !== 'none' && linkedItems.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No {linkedType}s available to link
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save {isTodo ? 'Todo' : 'Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
