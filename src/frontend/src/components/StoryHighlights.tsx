import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CheckCircle2, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "../backend.d";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Highlight {
  id: string;
  title: string;
  coverEmoji: string;
  coverColor: string; // gradient key
  storyIds: string[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const HIGHLIGHTS_KEY = "vg_highlights";

const COVER_EMOJIS = ["🌟", "❤️", "🎉", "🏖️", "🎵", "✈️", "🐾", "🌸"];

const COVER_COLORS: { key: string; gradient: string; label: string }[] = [
  {
    key: "purple-pink",
    gradient:
      "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
    label: "Purple Pink",
  },
  {
    key: "blue-cyan",
    gradient:
      "linear-gradient(135deg, oklch(0.6 0.2 225), oklch(0.65 0.18 195))",
    label: "Blue Cyan",
  },
  {
    key: "pink-orange",
    gradient:
      "linear-gradient(135deg, oklch(0.65 0.25 350), oklch(0.72 0.22 55))",
    label: "Pink Orange",
  },
  {
    key: "green-teal",
    gradient:
      "linear-gradient(135deg, oklch(0.62 0.2 165), oklch(0.6 0.18 195))",
    label: "Green Teal",
  },
];

// ─── localStorage helpers ──────────────────────────────────────────────────────

export function getHighlights(): Highlight[] {
  try {
    const raw = localStorage.getItem(HIGHLIGHTS_KEY);
    return raw ? (JSON.parse(raw) as Highlight[]) : [];
  } catch {
    return [];
  }
}

function saveHighlights(highlights: Highlight[]) {
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights));
}

// ─── Cover circle helper ───────────────────────────────────────────────────────

function getGradient(colorKey: string): string {
  return (
    COVER_COLORS.find((c) => c.key === colorKey)?.gradient ||
    COVER_COLORS[0].gradient
  );
}

// ─── Highlight Circle ──────────────────────────────────────────────────────────

function HighlightCircle({
  highlight,
  onClick,
  onDelete,
  index,
}: {
  highlight: Highlight;
  onClick: () => void;
  onDelete: () => void;
  index: number;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (!showMenu) onClick();
  };

  return (
    <div className="relative flex flex-col items-center gap-1.5 flex-shrink-0">
      <button
        type="button"
        data-ocid={`profile.highlight.item.${index + 1}`}
        onClick={handleClick}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onBlur={() => setShowMenu(false)}
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ background: getGradient(highlight.coverColor) }}
        aria-label={`Highlight: ${highlight.title}`}
      >
        {highlight.coverEmoji}
      </button>

      <span className="text-[10px] text-muted-foreground max-w-[64px] truncate text-center leading-tight">
        {highlight.title.slice(0, 10)}
      </span>

      {/* Context menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 4 }}
            className="absolute top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden min-w-[110px]"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onDelete();
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X size={14} />
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CreateHighlightSheet ─────────────────────────────────────────────────────

function CreateHighlightSheet({
  open,
  onOpenChange,
  storyPosts,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  storyPosts: Post[];
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(COVER_EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(COVER_COLORS[0].key);
  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleStory = (id: string) => {
    setSelectedStoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    const newHighlight: Highlight = {
      id: `hl_${Date.now()}`,
      title: title.trim(),
      coverEmoji: selectedEmoji,
      coverColor: selectedColor,
      storyIds: Array.from(selectedStoryIds),
    };
    const existing = getHighlights();
    saveHighlights([...existing, newHighlight]);
    onCreated();
    onOpenChange(false);
    setTitle("");
    setSelectedEmoji(COVER_EMOJIS[0]);
    setSelectedColor(COVER_COLORS[0].key);
    setSelectedStoryIds(new Set());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-3xl bg-card border-border flex flex-col p-0"
        data-ocid="profile.highlight.create.dialog"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="font-display text-base">
            New Highlight
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-4 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Title</Label>
              <Input
                data-ocid="profile.highlight.create.title.input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Travel, Memories..."
                className="bg-secondary border-border"
                maxLength={20}
              />
            </div>

            {/* Cover emoji */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cover Emoji</Label>
              <div className="flex gap-2 flex-wrap">
                {COVER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-10 h-10 rounded-full text-xl flex items-center justify-center border-2 transition-all ${
                      selectedEmoji === emoji
                        ? "border-vibe-purple scale-110"
                        : "border-transparent bg-secondary"
                    }`}
                    aria-label={`Select emoji ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover color */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cover Color</Label>
              <div className="flex gap-3">
                {COVER_COLORS.map((color) => (
                  <button
                    key={color.key}
                    type="button"
                    onClick={() => setSelectedColor(color.key)}
                    aria-label={`Select color ${color.label}`}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === color.key
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ background: color.gradient }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: getGradient(selectedColor) }}
              >
                {selectedEmoji}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {title || "Highlight Title"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedStoryIds.size}{" "}
                  {selectedStoryIds.size === 1 ? "story" : "stories"}
                </p>
              </div>
            </div>

            {/* Story selection */}
            {storyPosts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Select Stories ({storyPosts.length} available)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {storyPosts.map((post) => {
                    const postId = post.id.toString();
                    const isSelected = selectedStoryIds.has(postId);
                    const mediaUrl = post.media?.getDirectURL();
                    return (
                      <button
                        key={postId}
                        type="button"
                        onClick={() => toggleStory(postId)}
                        className="aspect-square rounded-xl overflow-hidden relative border-2 transition-all"
                        style={{
                          borderColor: isSelected
                            ? "oklch(0.62 0.22 295)"
                            : "transparent",
                        }}
                      >
                        {mediaUrl ? (
                          post.mediaType === "video" ? (
                            <video
                              src={mediaUrl}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img
                              src={mediaUrl}
                              alt="story"
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full gradient-bg opacity-60" />
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <CheckCircle2
                              size={22}
                              className="text-white drop-shadow"
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {storyPosts.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No stories yet. Post a story first to add to highlights.
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-5 py-4 border-t border-border">
          <Button
            data-ocid="profile.highlight.create.submit_button"
            onClick={handleCreate}
            disabled={!title.trim()}
            className="w-full btn-gradient border-0 h-11 font-semibold"
          >
            Create Highlight
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── HighlightViewerSheet ─────────────────────────────────────────────────────

function HighlightViewerSheet({
  highlight,
  open,
  onOpenChange,
  storyPosts,
}: {
  highlight: Highlight | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  storyPosts: Post[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const highlightStories = highlight
    ? storyPosts.filter((p) => highlight.storyIds.includes(p.id.toString()))
    : [];

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < highlightStories.length - 1) return prev + 1;
      onOpenChange(false);
      return prev;
    });
    setProgress(0);
  }, [highlightStories.length, onOpenChange]);

  const goPrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setProgress(0);
  };

  // Reset on open
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [open]);

  // Auto-advance timer
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentIndex intentionally restarts timer on slide change
  useEffect(() => {
    if (!open || highlightStories.length === 0) return;
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, currentIndex, highlightStories.length, goNext]);

  if (!highlight) return null;

  const currentStory = highlightStories[currentIndex];
  const mediaUrl = currentStory?.media?.getDirectURL();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[100dvh] p-0 border-0 bg-black"
        data-ocid="profile.highlight.viewer.sheet"
      >
        <div className="relative w-full h-full overflow-hidden">
          {/* Background media */}
          {mediaUrl ? (
            currentStory?.mediaType === "video" ? (
              <video
                src={mediaUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={mediaUrl}
                alt="highlight story"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full gradient-bg" />
          )}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Progress bars */}
          <div className="absolute top-12 left-4 right-4 flex gap-1 z-20">
            {highlightStories.map((story, i) => (
              <div
                key={`prog-${story.id.toString()}`}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{
                    width:
                      i < currentIndex
                        ? "100%"
                        : i === currentIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ background: getGradient(highlight.coverColor) }}
              >
                {highlight.coverEmoji}
              </div>
              <span className="text-white font-semibold text-sm drop-shadow">
                {highlight.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"
              aria-label="Close highlight viewer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tap zones */}
          <div className="absolute inset-0 flex z-10">
            <button
              type="button"
              className="w-1/3 h-full focus:outline-none"
              onClick={goPrev}
              aria-label="Previous story"
            />
            <button
              type="button"
              className="w-2/3 h-full focus:outline-none"
              onClick={goNext}
              aria-label="Next story"
            />
          </div>

          {/* Empty state */}
          {highlightStories.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <p className="text-white/70 text-sm">
                No stories in this highlight
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── HighlightsRow (main export) ───────────────────────────────────────────────

export function HighlightsRow({ storyPosts }: { storyPosts: Post[] }) {
  const [highlights, setHighlights] = useState<Highlight[]>(getHighlights);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(
    null,
  );

  const refreshHighlights = () => setHighlights(getHighlights());

  const handleDelete = (id: string) => {
    const updated = highlights.filter((h) => h.id !== id);
    saveHighlights(updated);
    setHighlights(updated);
  };

  const handleViewHighlight = (highlight: Highlight) => {
    setActiveHighlight(highlight);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="px-5 py-4 border-b border-border">
        {/* Horizontal scroll row */}
        <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1">
          {/* New highlight button */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              data-ocid="profile.highlights.new_button"
              onClick={() => setCreateOpen(true)}
              className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-secondary hover:bg-secondary/80 transition-colors"
              aria-label="Create new highlight"
            >
              <Plus size={22} className="text-muted-foreground" />
            </button>
            <span className="text-[10px] text-muted-foreground">New</span>
          </div>

          {/* Existing highlights */}
          {highlights.map((highlight, index) => (
            <HighlightCircle
              key={highlight.id}
              highlight={highlight}
              index={index}
              onClick={() => handleViewHighlight(highlight)}
              onDelete={() => handleDelete(highlight.id)}
            />
          ))}
        </div>
      </div>

      <CreateHighlightSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        storyPosts={storyPosts}
        onCreated={refreshHighlights}
      />

      <HighlightViewerSheet
        highlight={activeHighlight}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        storyPosts={storyPosts}
      />
    </>
  );
}
