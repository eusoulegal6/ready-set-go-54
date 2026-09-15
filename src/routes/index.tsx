import { useState, useEffect, useMemo, useId } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Copy,
  Check,
  Download,
  FileText,
  Clock,
  Sparkles,
  BookOpen,
  Tag,
  Menu,
  X,
  FolderOpen,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: NoteTakingApp,
});

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  color: string;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

const CATEGORIES = ["All", "Work", "Personal", "Ideas", "Tasks", "Study"];

const COLOR_ACCENTS = [
  { name: "Default", bg: "bg-card border-border", dot: "bg-slate-400" },
  { name: "Amber", bg: "bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/20", dot: "bg-amber-500" },
  { name: "Emerald", bg: "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20", dot: "bg-emerald-500" },
  { name: "Sky", bg: "bg-sky-500/10 border-sky-500/30 dark:bg-sky-950/20", dot: "bg-sky-500" },
  { name: "Violet", bg: "bg-violet-500/10 border-violet-500/30 dark:bg-violet-950/20", dot: "bg-violet-500" },
  { name: "Rose", bg: "bg-rose-500/10 border-rose-500/30 dark:bg-rose-950/20", dot: "bg-rose-500" },
];

const INITIAL_NOTES: Note[] = [
  {
    id: "welcome-note-1",
    title: "Welcome to Notes! 📝",
    content: `Welcome to your clean, distraction-free note taking app.\n\n✨ Key Features:\n• Instant auto-save to browser storage\n• Pin important notes to the top\n• Filter by categories & search titles or content\n• Markdown-friendly text formatting\n• Export notes anytime as Markdown files\n• Quick copy & word count stats\n\nTry clicking "+ New Note" or editing this note directly!`,
    category: "Personal",
    color: "Sky",
    isPinned: true,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: "ideas-note-2",
    title: "Project Roadmap & Brainstorming 🚀",
    content: `Goals for this quarter:\n1. Launch the new product MVP\n2. Gather user feedback on the editor experience\n3. Add offline sync & dark mode styling\n4. Write comprehensive documentation\n\nNotes from meeting:\n- Prioritize simplicity over cluttered tooling\n- Fast search is essential for productivity`,
    category: "Ideas",
    color: "Amber",
    isPinned: true,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 1,
  },
  {
    id: "tasks-note-3",
    title: "Weekly Checklist ✅",
    content: `- [x] Review recent pull requests\n- [x] Send weekly sprint status update\n- [ ] Plan next sprint milestones\n- [ ] Clean up project repository and test builds\n- [ ] Catch up on tech newsletters`,
    category: "Tasks",
    color: "Emerald",
    isPinned: false,
    createdAt: Date.now() - 3600000 * 5,
    updatedAt: Date.now() - 3600000 * 3,
  },
];

const STORAGE_KEY = "lovable_notes_app_data_v1";

function NoteTakingApp() {
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.error("Failed to load notes from localStorage", err);
      }
    }
    return INITIAL_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return INITIAL_NOTES[0]?.id || "";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const searchInputId = useId();

  // Sync to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (err) {
      console.error("Failed to save notes to localStorage", err);
    }
  }, [notes]);

  // Ensure active note exists
  useEffect(() => {
    if (notes.length > 0 && !notes.some((n) => n.id === activeNoteId)) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  // Keyboard shortcut: Ctrl/Cmd + Alt + N or Ctrl + N (prevent default browser new window where appropriate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n" && e.altKey) {
        e.preventDefault();
        handleCreateNote();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCategory]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const matchesCategory =
          selectedCategory === "All" || note.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch =
          searchQuery.trim() === "" ||
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, selectedCategory, searchQuery]);

  // Actions
  const handleCreateNote = () => {
    const newNote: Note = {
      id: "note-" + Date.now(),
      title: "Untitled Note",
      content: "",
      category: selectedCategory === "All" ? "Personal" : selectedCategory,
      color: "Default",
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setSidebarOpen(false);
  };

  const handleUpdateActiveNote = (updates: Partial<Note>) => {
    if (!activeNoteId) return;
    setNotes((prev) =>
      prev.map((note) =>
        note.id === activeNoteId
          ? {
              ...note,
              ...updates,
              updatedAt: Date.now(),
            }
          : note
      )
    );
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      if (remaining.length > 0) {
        setActiveNoteId(remaining[0].id);
      }
    }
  };

  const handleTogglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, isPinned: !note.isPinned } : note))
    );
  };

  const handleCopyContent = () => {
    if (!activeNote) return;
    const fullText = `${activeNote.title}\n\n${activeNote.content}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    if (!activeNote) return;
    const element = document.createElement("a");
    const file = new Blob([`# ${activeNote.title}\n\n${activeNote.content}`], {
      type: "text/markdown",
    });
    element.href = URL.createObjectURL(file);
    element.download = `${activeNote.title.replace(/[/\\?%*:|"<>]/g, "-") || "note"}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const wordCount = useMemo(() => {
    if (!activeNote || !activeNote.content.trim()) return 0;
    return activeNote.content.trim().split(/\s+/).length;
  }, [activeNote]);

  const charCount = useMemo(() => {
    return activeNote?.content?.length || 0;
  }, [activeNote]);

  const formatTimestamp = (ts: number) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  };

  const activeColorObj = useMemo(() => {
    return COLOR_ACCENTS.find((c) => c.name === activeNote?.color) || COLOR_ACCENTS[0];
  }, [activeNote]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSidebarOpen(false);
          }}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-border bg-card/80 backdrop-blur-md transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none">QuickNotes</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {notes.length} {notes.length === 1 ? "note" : "notes"} stored
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCreateNote}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
              title="Create new note"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3">
          <div className="relative">
            <label htmlFor={searchInputId} className="sr-only">
              Search notes
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              id={searchInputId}
              type="text"
              placeholder="Search title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background/60 py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1 overflow-x-auto px-3 pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FolderOpen className="h-8 w-8 mb-2 stroke-[1.5] text-muted-foreground/60" />
              <p className="text-xs font-medium">No notes found</p>
              <p className="text-[11px] mt-0.5 max-w-[180px]">
                {searchQuery ? "Try changing your search keywords" : "Click 'New' above to create one"}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isActive = note.id === activeNoteId;
              const colorInfo = COLOR_ACCENTS.find((c) => c.name === note.color) || COLOR_ACCENTS[0];

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveNoteId(note.id);
                    setSidebarOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveNoteId(note.id);
                      setSidebarOpen(false);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`group relative flex flex-col rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                    isActive
                      ? "border-primary/60 bg-primary/5 shadow-xs"
                      : "border-border/60 bg-card hover:border-border hover:bg-accent/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${colorInfo.dot}`} />
                      <h3
                        className={`truncate text-xs font-semibold ${
                          isActive ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {note.title || "Untitled"}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {note.isPinned && (
                        <Pin className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                      )}
                    </div>
                  </div>

                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
                    {note.content.trim() || "Empty note content..."}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/75">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                      {note.category}
                    </span>
                    <span>{formatTimestamp(note.updatedAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-border/70 p-3 text-[11px] text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            Simple & local
          </span>
          <span className="text-[10px] bg-muted/60 px-2 py-0.5 rounded">Ctrl + N for new</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/60 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            {activeNote && (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border ${activeColorObj.bg}`}
                >
                  <Tag className="h-3 w-3 opacity-70" />
                  {activeNote.category}
                </span>

                <span className="hidden sm:inline-block text-xs text-muted-foreground">
                  Updated {formatTimestamp(activeNote.updatedAt)}
                </span>
              </div>
            )}
          </div>

          {activeNote ? (
            <div className="flex items-center gap-1.5">
              {/* Pin Button */}
              <button
                type="button"
                onClick={() => handleTogglePin(activeNote.id)}
                className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors ${
                  activeNote.isPinned
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
                title={activeNote.isPinned ? "Unpin note" : "Pin to top"}
              >
                {activeNote.isPinned ? (
                  <>
                    <PinOff className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Pinned</span>
                  </>
                ) : (
                  <>
                    <Pin className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Pin</span>
                  </>
                )}
              </button>

              {/* Copy Content */}
              <button
                type="button"
                onClick={handleCopyContent}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Copy note text"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="hidden sm:inline text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>

              {/* Export Markdown */}
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Export as Markdown"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Delete Note */}
              <button
                type="button"
                onClick={() => handleDeleteNote(activeNote.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-destructive transition-colors hover:bg-destructive/10 hover:border-destructive/30"
                title="Delete note"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCreateNote}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Note
            </button>
          )}
        </header>

        {/* Note Editor Body */}
        {activeNote ? (
          <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-8 lg:px-16 max-w-4xl mx-auto w-full">
            {/* Note Meta Bar: Category and Color Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-2 border-b border-border/50">
              {/* Category selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Category:</span>
                <select
                  value={activeNote.category}
                  onChange={(e) => handleUpdateActiveNote({ category: e.target.value })}
                  className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Accents */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium mr-1">Color:</span>
                {COLOR_ACCENTS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleUpdateActiveNote({ color: color.name })}
                    className={`h-5 w-5 rounded-full border transition-all ${color.dot} ${
                      activeNote.color === color.name
                        ? "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Note Title Input */}
            <input
              type="text"
              placeholder="Note Title..."
              value={activeNote.title}
              onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
              className="w-full bg-transparent text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/50 focus:outline-none mb-4"
            />

            {/* Content Textarea */}
            <textarea
              placeholder="Write your thoughts, checklist, or ideas here (Markdown supported)..."
              value={activeNote.content}
              onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
              className="flex-1 w-full resize-none bg-transparent text-sm sm:text-base leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-h-[300px]"
            />

            {/* Bottom Note Stats */}
            <footer className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>
                <span>•</span>
                <span>{charCount} chars</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Clock className="h-3 w-3" />
                Auto-saved locally
              </div>
            </footer>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h2 className="text-base font-semibold text-foreground">No note selected</h2>
            <p className="text-xs max-w-sm mt-1 text-muted-foreground">
              Select an existing note from the sidebar or click below to start a brand new one.
            </p>
            <button
              type="button"
              onClick={handleCreateNote}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Note
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

