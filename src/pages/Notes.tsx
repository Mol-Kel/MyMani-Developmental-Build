import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, BookOpen, Edit, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { noteStorage } from '@/lib/storage';
import { Note } from '@/types';
import { formatDate } from '@/lib/formatters';
import { toast } from 'sonner';

const Notes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isTodo, setIsTodo] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const allNotes = noteStorage.getAll();
    const sorted = allNotes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setNotes(sorted);
  };

  const handleSave = () => {
    if (!noteContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (editingNote) {
      noteStorage.update(editingNote.id, { 
        content: noteContent.trim(),
        isTodo,
      });
      toast.success('Note updated');
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        content: noteContent.trim(),
        isTodo,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      noteStorage.add(newNote);
      toast.success('Note added');
    }

    setIsDialogOpen(false);
    setEditingNote(null);
    setNoteContent('');
    setIsTodo(false);
    loadNotes();
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setIsTodo(note.isTodo || false);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      noteStorage.delete(id);
      loadNotes();
      toast.success('Note deleted');
    }
  };

  const handleAddNew = () => {
    setEditingNote(null);
    setNoteContent('');
    setIsTodo(false);
    setIsDialogOpen(true);
  };

  const handleToggleComplete = (note: Note) => {
    noteStorage.update(note.id, {
      isCompleted: !note.isCompleted,
    });
    loadNotes();
    toast.success(note.isCompleted ? 'Todo unchecked' : 'Todo completed');
  };

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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAddNew}
              className="text-primary-foreground hover:bg-white/20"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {notes.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start writing down your thoughts and ideas
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(note.createdAt)}
                        </p>
                        {note.isTodo && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Todo
                          </span>
                        )}
                      </div>
                      <p className={`text-foreground whitespace-pre-wrap break-words ${note.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {note.content}
                      </p>
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
            ))}
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
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
              className="min-h-[200px]"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
