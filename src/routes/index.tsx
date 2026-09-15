import { useState, useEffect, useMemo, useId, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Trash2,
  Pin,
  PinOff,
  Copy,
  Check,
  Download,
  FileText,
  Folder,
  Tag,
  Moon,
  Sun,
  SquarePen,
  Share2,
  CheckSquare,
  Sparkles,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Strikethrough,
  Eye,
  Edit3,
  Grid,
  List as ListIcon,
  PanelLeft,
  User,
  Briefcase,
  Lightbulb,
  CheckSquare2,
  Archive,
  ChevronRight,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: NoteTakingApp,
});

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  folder: string;
  color: string;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

const FOLDERS = [
  { id: "all", name: "All iCloud", icon: Folder, countKey: "all" },
  { id: "notes", name: "Notes", icon: FileText, countKey: "Notes" },
  { id: "personal", name: "Personal", icon: User, countKey: "Personal" },
  { id: "work", name: "Work", icon: Briefcase, countKey: "Work" },
  { id: "ideas", name: "Ideas", icon: Lightbulb, countKey: "Ideas" },
  { id: "tasks", name: "Checklists", icon: CheckSquare2, countKey: "Tasks" },
  { id: "archive", name: "Archive", icon: Archive, countKey: "Archive" },
];

const COLOR_ACCENTS = [
  { name: "Amber", hex: "#E49B0F", label: "Classic Amber" },
  { name: "Blue", hex: "#007AFF", label: "System Blue" },
  { name: "Green", hex: "#34C759", label: "Mint Green" },
  { name: "Purple", hex: "#AF52DE", label: "Deep Purple" },
  { name: "Rose", hex: "#FF2D55", label: "Coral Rose" },
];

const INITIAL_NOTES: Note[] = [
  {
    id: "apple-welcome-1",
    title: "Welcome to Apple Notes 📝",
    content: `Crafted with Apple's Human Interface Guidelines.\n\n✨ Design Foundations:\n- [x] Liquid Glass functional navigation & toolbars\n- [x] SF Pro typography with optical balance\n- [x] 3-pane macOS & iPadOS layout structure\n- [x] Pinned notes grouped at top\n- [x] Live interactive checklist toggling\n- [ ] Try creating your own note with ⌘N\n\nExperience seamless local auto-saving, Markdown formatting, and instant search.`,
    category: "Notes",
    folder: "Notes",
    color: "Amber",
    isPinned: true,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: "apple-ideas-2",
    title: "Design System & HIG Craft 🍏",
    content: `Principles from Apple's Design Craft:\n\n1. Purpose: Make something meaningful\n2. Agency: Let people do things their way\n3. Simplicity: Every element earns its place\n4. Craft: Care about every spacing and transition\n\nKey notes on Liquid Glass:\n- Only functional layers receive glass blur\n- Content remains crisp and legible\n- Restraint in accent colors: monochromatic labels over vibrant backgrounds.`,
    category: "Ideas",
    folder: "Ideas",
    color: "Amber",
    isPinned: true,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 1,
  },
  {
    id: "apple-tasks-3",
    title: "Project Milestones & Checklist 🚀",
    content: `- [x] Setup repository & TanStack router\n- [x] Establish Apple design language & Liquid Glass styling\n- [x] Implement live interactive task checklist\n- [ ] Conduct user testing across macOS and iOS devices\n- [ ] Export documentation and sprint review summary`,
    category: "Tasks",
    folder: "Tasks",
    color: "Green",
    isPinned: false,
    createdAt: Date.now() - 3600000 * 5,
    updatedAt: Date.now() - 3600000 * 3,
  },
];

const STORAGE_KEY = "apple_notes_app_data_v2";

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

  const [selectedFolder, setSelectedFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputId = useId();

  // Handle Dark Appearance in accordance with Apple HIG
  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  // Sync to local storage
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

  // Keyboard Shortcuts (Cmd/Ctrl+N, Cmd+F, Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleCreateNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFolder]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Filter notes by folder & search
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const matchesFolder =
          selectedFolder === "all" ||
          note.folder.toLowerCase() === selectedFolder.toLowerCase() ||
          note.category.toLowerCase() === selectedFolder.toLowerCase();

        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          query === "" ||
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query);

        return matchesFolder && matchesSearch;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, selectedFolder, searchQuery]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned), [filteredNotes]);
  const unpinnedNotes = useMemo(() => filteredNotes.filter((n) => !n.isPinned), [filteredNotes]);

  // Calculate folder counts
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notes.length };
    for (const n of notes) {
      const f = n.folder || n.category;
      counts[f] = (counts[f] || 0) + 1;
    }
    return counts;
  }, [notes]);

  // Create Note
  const handleCreateNote = () => {
    const defaultFolder = selectedFolder === "all" ? "Notes" : selectedFolder;
    const capitalized = defaultFolder.charAt(0).toUpperCase() + defaultFolder.slice(1);
    const newNote: Note = {
      id: "note-" + Date.now(),
      title: "New Note",
      content: "",
      category: capitalized,
      folder: capitalized,
      color: "Amber",
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setEditorMode("write");
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

  // Apple Text Formatting insertion helpers
  const insertTextFormatting = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current || !activeNote) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = activeNote.content;
    const selected = currentText.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);
    handleUpdateActiveNote({ content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 10);
  };

  // Toggle checkbox item in checklist mode
  const handleToggleChecklistLine = (lineIndex: number) => {
    if (!activeNote) return;
    const lines = activeNote.content.split("\n");
    if (lineIndex < lines.length) {
      const line = lines[lineIndex];
      if (line.startsWith("- [ ] ")) {
        lines[lineIndex] = line.replace("- [ ] ", "- [x] ");
      } else if (line.startsWith("- [x] ")) {
        lines[lineIndex] = line.replace("- [x] ", "- [ ] ");
      }
      handleUpdateActiveNote({ content: lines.join("\n") });
    }
  };

  // Formatting date in authentic Apple format: "Sep 15, 2026" or "11:45 AM"
  const formatAppleDate = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(date);
    }
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) {
      return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    }).format(date);
  };

  const formatAppleDetailDate = (ts: number) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(ts));
  };

  const wordCount = useMemo(() => {
    if (!activeNote || !activeNote.content.trim()) return 0;
    return activeNote.content.trim().split(/\s+/).length;
  }, [activeNote]);

  const charCount = useMemo(() => {
    return activeNote?.content?.length || 0;
  }, [activeNote]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] select-none font-sans">
      {/* 1. macOS Unified Window Toolbar (Liquid Glass Functional Layer) */}
      <header className="apple-glass-toolbar flex h-13 w-full shrink-0 items-center justify-between px-3.5 z-30">
        {/* Left: Window Traffic Lights & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {/* macOS Traffic Light Window Controls */}
          <div className="flex items-center gap-2 pr-1">
            <span className="h-3 w-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/40 hover:brightness-90 transition-all cursor-pointer shadow-xs" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/40 hover:brightness-90 transition-all cursor-pointer shadow-xs" />
            <span className="h-3 w-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/40 hover:brightness-90 transition-all cursor-pointer shadow-xs" />
          </div>

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5" />

          {/* Toggle Sidebar Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground transition-colors active:scale-95 ${
              sidebarOpen ? "bg-black/5 dark:bg-white/10 text-foreground" : ""
            }`}
            title="Toggle Sidebar (⌘S)"
            aria-label="Toggle Sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          {/* View Mode Toggle: List vs Grid */}
          <div className="hidden sm:flex items-center rounded-lg bg-black/5 dark:bg-white/10 p-0.5 border border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-white/20 text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="List View"
            >
              <ListIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-white/20 text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Gallery / Grid View"
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Search Field */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              id={searchInputId}
              type="text"
              placeholder="Search all notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/40 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/60 focus:bg-white dark:focus:bg-black/70 focus:outline-none focus:ring-1.5 focus:ring-[#E49B0F]/70 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions Cluster */}
        <div className="flex items-center gap-1.5">
          {/* New Note (Prominent Apple Button) */}
          <button
            type="button"
            onClick={handleCreateNote}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#E49B0F] hover:bg-[#D48D08] px-3 text-xs font-medium text-white shadow-xs active:scale-95 transition-all"
            title="Create New Note (⌘N)"
          >
            <SquarePen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-semibold">New Note</span>
          </button>

          {activeNote && (
            <>
              {/* Pin Note */}
              <button
                type="button"
                onClick={() => handleTogglePin(activeNote.id)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors active:scale-95 ${
                  activeNote.isPinned
                    ? "bg-[#E49B0F]/15 text-[#E49B0F] border border-[#E49B0F]/30"
                    : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                }`}
                title={activeNote.isPinned ? "Unpin Note" : "Pin Note to Top"}
              >
                {activeNote.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>

              {/* Share / Copy */}
              <button
                type="button"
                onClick={handleCopyContent}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground transition-colors active:scale-95"
                title="Copy Note Content"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </button>

              {/* Export Markdown */}
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground transition-colors active:scale-95"
                title="Export as Markdown"
              >
                <Download className="h-4 w-4" />
              </button>

              {/* Delete Note */}
              <button
                type="button"
                onClick={() => handleDeleteNote(activeNote.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors active:scale-95"
                title="Delete Note"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5" />

          {/* Dark Appearance Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground transition-colors active:scale-95"
            title={isDarkMode ? "Switch to Light Appearance" : "Switch to Dark Appearance"}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 2. Main 3-Pane / 2-Pane Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Column 1: Apple Sidebar (Folders & Collections) */}
        {sidebarOpen && (
          <aside className="apple-glass-sidebar w-56 sm:w-60 border-r border-black/8 dark:border-white/10 flex flex-col shrink-0 z-20 transition-all duration-300">
            {/* Folder Navigation Header */}
            <div className="px-3 pt-3 pb-1">
              <span className="text-[11px] font-semibold text-muted-foreground/80 tracking-wider uppercase px-2">
                iCloud
              </span>
            </div>

            {/* Folder List Items */}
            <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 apple-scrollbar">
              {FOLDERS.map((f) => {
                const isSelected = selectedFolder.toLowerCase() === f.id.toLowerCase();
                const IconComponent = f.icon;
                const count = folderCounts[f.countKey] || 0;

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFolder(f.id)}
                    className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all active:scale-[0.98] ${
                      isSelected
                        ? "bg-[#E49B0F]/15 dark:bg-[#E49B0F]/20 text-[#C48005] dark:text-[#F3B034] font-semibold"
                        : "text-foreground/90 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isSelected
                            ? "text-[#E49B0F]"
                            : "text-[#E49B0F]/80 dark:text-[#E49B0F]/90"
                        }`}
                      />
                      <span className="truncate">{f.name}</span>
                    </div>

                    <span
                      className={`text-[11px] font-normal px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-[#E49B0F]/20 dark:bg-[#E49B0F]/30 text-[#B37403] dark:text-[#F3B034]"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom Sidebar Status */}
            <div className="p-3 border-t border-black/8 dark:border-white/8 text-[11px] text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>iCloud Synced</span>
              </div>
              <span className="text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
                {notes.length} notes
              </span>
            </div>
          </aside>
        )}

        {/* Column 2: Notes List Pane (Master View) */}
        <section className="w-72 sm:w-80 border-r border-black/8 dark:border-white/10 bg-white/60 dark:bg-[#161618]/70 backdrop-blur-md flex flex-col shrink-0 overflow-hidden">
          {/* Notes List Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-black/6 dark:border-white/6">
            <span className="text-xs font-semibold text-foreground tracking-tight">
              {FOLDERS.find((f) => f.id === selectedFolder)?.name || "Notes"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {filteredNotes.length} {filteredNotes.length === 1 ? "Note" : "Notes"}
            </span>
          </div>

          {/* Note List Scroll View */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1 apple-scrollbar">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <FileText className="h-10 w-10 stroke-[1.2] mb-2 opacity-40 text-[#E49B0F]" />
                <p className="text-xs font-medium">No Notes Found</p>
                <p className="text-[11px] mt-1 max-w-[180px] opacity-70">
                  {searchQuery ? "No notes match your search" : "Click 'New Note' to get started"}
                </p>
              </div>
            ) : (
              <>
                {/* Pinned Section */}
                {pinnedNotes.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E49B0F]/90">
                      <Pin className="h-3 w-3 fill-current" />
                      <span>Pinned</span>
                    </div>

                    <div className="space-y-1">
                      {pinnedNotes.map((note) => renderNoteCard(note))}
                    </div>
                  </div>
                )}

                {/* Regular Notes Section */}
                {unpinnedNotes.length > 0 && (
                  <div>
                    {pinnedNotes.length > 0 && (
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                        Notes
                      </div>
                    )}
                    <div className="space-y-1">
                      {unpinnedNotes.map((note) => renderNoteCard(note))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Column 3: Note Canvas / Editor (Detail View) */}
        <main className="flex-1 flex flex-col apple-notes-canvas overflow-hidden relative">
          {activeNote ? (
            <>
              {/* Apple Notes Format Bar (Floating Functional Control) */}
              <div className="apple-glass-toolbar flex h-10 items-center justify-between px-4 border-b border-black/6 dark:border-white/8">
                {/* Formatting Tools */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => insertTextFormatting("**", "**")}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                    title="Bold (**text**)"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTextFormatting("*", "*")}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                    title="Italic (*text*)"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTextFormatting("~~", "~~")}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                    title="Strikethrough (~~text~~)"
                  >
                    <Strikethrough className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-3.5 w-px bg-black/10 dark:bg-white/10 mx-1" />

                  {/* Checklist Insertion */}
                  <button
                    type="button"
                    onClick={() => insertTextFormatting("\n- [ ] ")}
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground font-medium"
                    title="Insert Checklist Item"
                  >
                    <CheckSquare className="h-3.5 w-3.5 text-[#E49B0F]" />
                    <span className="hidden sm:inline">Checklist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTextFormatting("\n- ")}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                    title="Bulleted List"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTextFormatting("\n1. ")}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                    title="Numbered List"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-3.5 w-px bg-black/10 dark:bg-white/10 mx-1" />

                  {/* Folder Switcher */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Folder className="h-3.5 w-3.5 text-[#E49B0F]" />
                    <select
                      value={activeNote.folder}
                      onChange={(e) =>
                        handleUpdateActiveNote({
                          folder: e.target.value,
                          category: e.target.value,
                        })
                      }
                      className="bg-transparent border-0 text-xs text-foreground/80 focus:ring-0 cursor-pointer font-medium"
                    >
                      {FOLDERS.filter((f) => f.id !== "all").map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mode Switcher: Write vs Interactive Preview */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditorMode((prev) => (prev === "write" ? "preview" : "write"))}
                    className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all ${
                      editorMode === "preview"
                        ? "bg-[#E49B0F]/20 text-[#D48D08] dark:text-[#F3B034] font-semibold"
                        : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                    }`}
                    title="Toggle Interactive Checklist Preview"
                  >
                    {editorMode === "preview" ? (
                      <>
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Note Writing Surface */}
              <div className="flex-1 overflow-y-auto px-6 sm:px-12 lg:px-20 py-8 max-w-4xl mx-auto w-full select-text apple-scrollbar">
                {/* Centered Apple Date Stamp (Iconic Apple Notes Detail) */}
                <div className="text-center mb-6">
                  <span className="text-[11px] font-medium text-muted-foreground/75 tracking-tight">
                    {formatAppleDetailDate(activeNote.updatedAt)}
                  </span>
                </div>

                {/* Note Title */}
                <input
                  type="text"
                  placeholder="Title"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                  className="w-full bg-transparent text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 focus:outline-none mb-4 border-0 p-0"
                />

                {/* Editor or Interactive Preview Canvas */}
                {editorMode === "write" ? (
                  <textarea
                    ref={textareaRef}
                    placeholder="Type a note or list here..."
                    value={activeNote.content}
                    onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
                    className="w-full flex-1 bg-transparent resize-none text-base leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none border-0 p-0 min-h-[400px] font-sans"
                  />
                ) : (
                  /* Interactive Checklist & Markdown Preview */
                  <div className="space-y-2 text-base leading-relaxed text-foreground/95 py-2">
                    {activeNote.content.split("\n").map((line, idx) => {
                      if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
                        const isChecked = line.startsWith("- [x] ");
                        const text = line.replace(/^- \[( |x)\] /, "");
                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleChecklistLine(idx)}
                            className="flex items-start gap-2.5 cursor-pointer group py-0.5 hover:opacity-90 transition-opacity"
                          >
                            <span
                              className={`h-4.5 w-4.5 rounded-full border mt-1 flex items-center justify-center transition-colors ${
                                isChecked
                                  ? "bg-[#E49B0F] border-[#E49B0F] text-white"
                                  : "border-muted-foreground/40 group-hover:border-[#E49B0F]"
                              }`}
                            >
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </span>
                            <span
                              className={`${
                                isChecked
                                  ? "line-through text-muted-foreground/70"
                                  : "text-foreground"
                              }`}
                            >
                              {text}
                            </span>
                          </div>
                        );
                      }
                      if (line.startsWith("# ")) {
                        return (
                          <h1 key={idx} className="text-xl font-bold mt-4 mb-2">
                            {line.replace("# ", "")}
                          </h1>
                        );
                      }
                      if (line.startsWith("## ")) {
                        return (
                          <h2 key={idx} className="text-lg font-semibold mt-3 mb-1">
                            {line.replace("## ", "")}
                          </h2>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <li key={idx} className="ml-4 list-disc text-foreground/90">
                            {line.replace("- ", "")}
                          </li>
                        );
                      }
                      if (!line.trim()) {
                        return <div key={idx} className="h-3" />;
                      }
                      return <p key={idx}>{line}</p>;
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Canvas Status Bar */}
              <footer className="h-8 border-t border-black/6 dark:border-white/6 px-6 flex items-center justify-between text-[11px] text-muted-foreground select-none">
                <div className="flex items-center gap-3">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-[#E49B0F]" />
                  <span>Auto-saved to Local Storage</span>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 text-[#E49B0F]/40 mb-3" />
              <h2 className="text-base font-semibold text-foreground">No Note Selected</h2>
              <p className="text-xs max-w-sm mt-1 text-muted-foreground">
                Choose a note from the list on the left, or press New Note to write.
              </p>
              <button
                type="button"
                onClick={handleCreateNote}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#E49B0F] hover:bg-[#D48D08] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs"
              >
                <SquarePen className="h-3.5 w-3.5" />
                New Note
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );

  // Helper render for note card in Column 2
  function renderNoteCard(note: Note) {
    const isActive = note.id === activeNoteId;
    const dateFormatted = formatAppleDate(note.updatedAt);
    const previewContent = note.content.replace(/^#+ .*\n?/, "").trim() || "No additional text";

    return (
      <div
        key={note.id}
        onClick={() => setActiveNoteId(note.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setActiveNoteId(note.id);
          }
        }}
        role="button"
        tabIndex={0}
        className={`group relative flex flex-col rounded-lg px-3 py-2.5 text-left transition-all cursor-pointer select-none ${
          isActive
            ? "bg-[#E49B0F]/15 dark:bg-[#E49B0F]/20 text-[#8C5800] dark:text-[#F6B847]"
            : "hover:bg-black/5 dark:hover:bg-white/5 text-foreground"
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <h3
            className={`truncate text-xs font-semibold ${
              isActive ? "text-[#8C5800] dark:text-[#F6B847]" : "text-foreground"
            }`}
          >
            {note.title || "New Note"}
          </h3>

          {note.isPinned && (
            <Pin className="h-3 w-3 fill-[#E49B0F] text-[#E49B0F] shrink-0" />
          )}
        </div>

        {/* Date and Snippet Subtitle Row (Apple Notes Signature Layout) */}
        <div className="mt-1 flex items-baseline gap-2 text-[11px] truncate">
          <span className="font-semibold text-foreground/80 shrink-0 text-[10px]">
            {dateFormatted}
          </span>
          <span className="truncate text-muted-foreground/80 font-normal">
            {previewContent}
          </span>
        </div>

        {/* Folder Tag */}
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <Folder className="h-2.5 w-2.5 opacity-60" />
          <span>{note.folder}</span>
        </div>
      </div>
    );
  }
}


