import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Principal } from "@dfinity/principal";
import {
  ArrowLeft,
  Check,
  FileText,
  MessageSquare,
  Music2,
  Phone,
  Send,
  Video,
  X,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Message, UserId } from "../backend.d";
import { AudioCallSheet } from "../components/AudioCallSheet";
import { AvatarWithRing } from "../components/AvatarWithRing";
import {
  ALL_SONGS,
  type Song,
  type SongGenre,
} from "../components/CreativeToolbar";
import { VideoCallSheet } from "../components/VideoCallSheet";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useConversation,
  useGetUserProfile,
  useRecentConversations,
  useSendMessage,
} from "../hooks/useQueries";
import { formatRelativeTime } from "../utils/helpers";

// ─── Note types ───────────────────────────────────────────────────────────────

const VG_NOTE_KEY = "vg_note";

interface NoteData {
  text: string;
  song: Song | null;
  createdAt: number;
}

function getNote(): NoteData | null {
  try {
    const raw = localStorage.getItem(VG_NOTE_KEY);
    if (!raw) return null;
    const note = JSON.parse(raw) as NoteData;
    if (Date.now() - note.createdAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(VG_NOTE_KEY);
      return null;
    }
    return note;
  } catch {
    return null;
  }
}

function timeLeft(createdAt: number): string {
  const hoursLeft = Math.max(
    0,
    24 - Math.floor((Date.now() - createdAt) / (60 * 60 * 1000)),
  );
  return `${hoursLeft}h left`;
}

// ─── Note Sheet ───────────────────────────────────────────────────────────────

function NoteSheet({
  open,
  onOpenChange,
  onNoteChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNoteChange: () => void;
}) {
  const [text, setText] = useState("");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [musicGenre, setMusicGenre] = useState<SongGenre>("All");
  const NOTE_GENRES: SongGenre[] = [
    "All",
    "Pop",
    "Hip-Hop",
    "Bollywood",
    "R&B",
    "EDM",
  ];

  const handlePost = () => {
    if (!text.trim()) {
      toast.error("Write something first");
      return;
    }
    const note: NoteData = {
      text: text.trim(),
      song: selectedSong,
      createdAt: Date.now(),
    };
    localStorage.setItem(VG_NOTE_KEY, JSON.stringify(note));
    onNoteChange();
    onOpenChange(false);
    setText("");
    setSelectedSong(null);
    toast.success("Note posted!");
  };

  const handleClear = () => {
    localStorage.removeItem(VG_NOTE_KEY);
    onNoteChange();
    onOpenChange(false);
    setText("");
    setSelectedSong(null);
    toast.success("Note cleared");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-border pb-safe max-h-[85vh] overflow-y-auto"
        style={{ background: "oklch(0.14 0.008 260)" }}
        data-ocid="messages.note.sheet"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-lg">Your Note</SheetTitle>
          <p className="text-xs text-muted-foreground -mt-1">
            Share what's on your mind with your followers
          </p>
        </SheetHeader>

        <div className="space-y-4">
          {/* Text area */}
          <div className="space-y-1.5">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 60))}
              placeholder="What's on your mind?"
              className="bg-secondary border-border resize-none text-sm"
              rows={3}
              data-ocid="messages.note.textarea"
            />
            <p className="text-xs text-muted-foreground text-right">
              {text.length}/60
            </p>
          </div>

          {/* Song picker */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Add a Song
            </p>
            {/* Genre tabs */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {NOTE_GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setMusicGenre(genre)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                    musicGenre === genre
                      ? "text-white"
                      : "bg-secondary/80 text-muted-foreground hover:text-foreground",
                  )}
                  style={
                    musicGenre === genre
                      ? {
                          background:
                            "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                        }
                      : undefined
                  }
                >
                  {genre}
                </button>
              ))}
            </div>
            {/* Song list */}
            <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-none">
              {ALL_SONGS.filter(
                (s) => musicGenre === "All" || s.genre === musicGenre,
              ).map((song) => {
                const isSelected =
                  selectedSong?.title === song.title &&
                  selectedSong?.artist === song.artist;
                return (
                  <button
                    key={`${song.title}-${song.artist}`}
                    type="button"
                    onClick={() => setSelectedSong(isSelected ? null : song)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all",
                      isSelected
                        ? "border border-primary/50"
                        : "bg-secondary/60 hover:bg-secondary",
                    )}
                    style={
                      isSelected
                        ? { background: "oklch(0.62 0.22 295 / 0.15)" }
                        : undefined
                    }
                  >
                    <div
                      className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white"
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))"
                          : "oklch(0.22 0.015 280)",
                      }}
                    >
                      <Music2 size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-foreground">
                        {song.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {song.artist}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={12} className="text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClear}
              data-ocid="messages.note.clear_button"
              className="flex-1 h-10 rounded-xl text-sm font-semibold border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
            >
              Clear Note
            </button>
            <button
              type="button"
              onClick={handlePost}
              disabled={!text.trim()}
              data-ocid="messages.note.post_button"
              className="flex-1 h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
              }}
            >
              Post Note
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Note Bubble ──────────────────────────────────────────────────────────────

function NoteBubble({ onDismiss }: { onDismiss: () => void }) {
  const note = getNote();
  if (!note) return null;

  return (
    <div
      className="mx-4 my-3 relative"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.62 0.22 295 / 0.1), oklch(0.65 0.25 350 / 0.1))",
        border: "1px solid oklch(0.62 0.22 295 / 0.35)",
        borderRadius: "16px",
        padding: "12px 14px",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
          }}
        >
          <FileText size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {note.text}
          </p>
          {note.song && (
            <div className="flex items-center gap-1.5 mt-1">
              <Music2 size={11} className="text-primary shrink-0" />
              <p className="text-[11px] text-muted-foreground truncate">
                {note.song.title} · {note.song.artist}
              </p>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">
            {timeLeft(note.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-secondary/80 transition-colors text-muted-foreground"
          aria-label="Dismiss note"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

function ConversationItem({
  userId,
  isSelected,
  onSelect,
}: {
  userId: UserId;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { data: profile } = useGetUserProfile(userId);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors",
        isSelected ? "bg-vibe-purple/10" : "hover:bg-secondary/50",
      )}
    >
      <AvatarWithRing profile={profile} size="md" showRing={isSelected} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-display truncate">
          {profile?.displayName || "..."}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          @{profile?.username || "..."}
        </p>
      </div>
    </button>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
          isOwn
            ? "gradient-bg text-white rounded-br-sm"
            : "bg-secondary text-foreground rounded-bl-sm",
        )}
      >
        <p className="leading-relaxed">{message.text}</p>
        <p
          className={cn(
            "text-[10px] mt-1",
            isOwn ? "text-white/60 text-right" : "text-muted-foreground",
          )}
        >
          {formatRelativeTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function ChatView({
  userId,
  onBack,
}: {
  userId: UserId;
  onBack: () => void;
}) {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetUserProfile(userId);
  const { data: messages = [], isLoading } = useConversation(userId);
  const sendMessage = useSendMessage();
  const [text, setText] = useState("");
  const [audioCallOpen, setAudioCallOpen] = useState(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentPrincipal = identity?.getPrincipal().toString();

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText("");
    await sendMessage.mutateAsync({ receiverId: userId, text: msg });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Audio + Video call sheets */}
      <AudioCallSheet
        open={audioCallOpen}
        onOpenChange={setAudioCallOpen}
        userId={userId}
      />
      <VideoCallSheet
        open={videoCallOpen}
        onOpenChange={setVideoCallOpen}
        userId={userId}
      />

      {/* Chat header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-border"
        style={{
          background: "oklch(0.14 0.008 260 / 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground p-1 lg:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <AvatarWithRing profile={profile} size="sm" showRing />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold font-display truncate">
            {profile?.displayName || "..."}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            @{profile?.username || "..."}
          </p>
        </div>

        {/* Call buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setAudioCallOpen(true)}
            data-ocid="chat.audio_call.button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            aria-label="Audio call"
          >
            <Phone size={17} />
          </button>
          <button
            type="button"
            onClick={() => setVideoCallOpen(true)}
            data-ocid="chat.video_call.button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            aria-label="Video call"
          >
            <Video size={17} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="space-y-3" data-ocid="messages.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  i % 2 === 0 ? "justify-end" : "justify-start",
                )}
              >
                <Skeleton
                  className={cn(
                    "h-10 rounded-2xl",
                    i % 2 === 0 ? "w-48" : "w-40",
                  )}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-40 text-center"
            data-ocid="messages.empty_state"
          >
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hi! 👋
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <MessageBubble
                key={message.id.toString()}
                message={message}
                isOwn={message.senderId.toString() === currentPrincipal}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex gap-2">
        <Input
          data-ocid="messages.input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          className="flex-1 bg-secondary border-border text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          size="icon"
          data-ocid="messages.send.button"
          onClick={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
          className="btn-gradient shrink-0"
        >
          {sendMessage.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </div>
    </div>
  );
}

export function MessagesPage() {
  const { data: conversationUserIds = [], isLoading } =
    useRecentConversations();
  const [selectedUserId, setSelectedUserId] = useState<UserId | null>(null);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [noteVersion, setNoteVersion] = useState(0);

  const handleNoteChange = () => setNoteVersion((v) => v + 1);

  const dismissNote = () => {
    localStorage.removeItem(VG_NOTE_KEY);
    handleNoteChange();
  };

  // Check for URL params for direct navigation
  useEffect(() => {
    const url = new URL(window.location.href);
    const userId = url.searchParams.get("userId");
    if (userId) {
      try {
        setSelectedUserId(Principal.fromText(userId));
      } catch {}
    }
  }, []);

  // Track note existence
  const currentNote = noteVersion >= 0 ? getNote() : null;

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      {/* Note Sheet */}
      <NoteSheet
        open={noteSheetOpen}
        onOpenChange={setNoteSheetOpen}
        onNoteChange={handleNoteChange}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3 border-b border-border flex items-center"
        style={{
          background: "oklch(0.14 0.008 260 / 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {selectedUserId && (
          <button
            type="button"
            onClick={() => setSelectedUserId(null)}
            className="text-muted-foreground hover:text-foreground p-1 mr-2 lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-xl font-bold font-display flex-1">Messages</h1>
        {!selectedUserId && (
          <button
            type="button"
            onClick={() => setNoteSheetOpen(true)}
            data-ocid="messages.note.button"
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            aria-label="Your note"
          >
            <FileText size={18} />
          </button>
        )}
      </header>

      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedUserId ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col bg-background"
            >
              <ChatView
                userId={selectedUserId}
                onBack={() => setSelectedUserId(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              {/* Note bubble at the top */}
              {currentNote && <NoteBubble onDismiss={dismissNote} />}

              {isLoading ? (
                <div
                  className="space-y-0"
                  data-ocid="messages.list.loading_state"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversationUserIds.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-20 text-center px-6"
                  data-ocid="messages.empty_state"
                >
                  <div className="gradient-bg rounded-3xl p-6 mb-5 shadow-glow">
                    <MessageSquare size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-2">
                    No messages yet
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Follow users and start a conversation from their profile
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {conversationUserIds.map((userId) => (
                    <ConversationItem
                      key={userId.toString()}
                      userId={userId}
                      isSelected={false}
                      onSelect={() => setSelectedUserId(userId)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
