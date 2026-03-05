import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Share2, UserPlus, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface LiveStreamSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_COMMENTS = [
  { id: 1, user: "vibefan99", text: "Omg you're live!! 🔥" },
  { id: 2, user: "photography_love", text: "hey!! love your content!" },
  { id: 3, user: "sunsetcreative", text: "finally going live! 💜" },
  { id: 4, user: "digital_nomad", text: "watched you for so long 🙌" },
  { id: 5, user: "creativespark", text: "this is so cool!!!" },
  { id: 6, user: "moonlightvibes", text: "sending love from NYC 🗽" },
  { id: 7, user: "cozy_aesthetic", text: "you look amazing!" },
];

const REACTION_EMOJIS = ["❤️", "🔥", "😮", "👏", "💜"];

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
}

export function LiveStreamSheet({ open, onOpenChange }: LiveStreamSheetProps) {
  const [viewerCount, setViewerCount] = useState(0);
  const [visibleComments, setVisibleComments] = useState<typeof MOCK_COMMENTS>(
    [],
  );
  const [floatingReactions, setFloatingReactions] = useState<
    FloatingReaction[]
  >([]);
  const [isEnding, setIsEnding] = useState(false);
  const reactionIdRef = useRef(0);
  const commentIndexRef = useRef(0);
  const finalViewerCount = useRef(0);

  // Grow viewer count
  useEffect(() => {
    if (!open) return;
    setViewerCount(0);
    setVisibleComments([]);
    commentIndexRef.current = 0;
    setIsEnding(false);

    const viewerInterval = setInterval(() => {
      setViewerCount((prev) => {
        const next = prev + Math.floor(Math.random() * 3 + 1);
        finalViewerCount.current = next;
        return next > 47 ? 47 : next;
      });
    }, 600);

    return () => clearInterval(viewerInterval);
  }, [open]);

  // Show comments one by one
  useEffect(() => {
    if (!open) return;
    const commentInterval = setInterval(() => {
      if (commentIndexRef.current < MOCK_COMMENTS.length) {
        const next = MOCK_COMMENTS[commentIndexRef.current];
        setVisibleComments((prev) => [...prev.slice(-5), next]);
        commentIndexRef.current++;
      }
    }, 1800);
    return () => clearInterval(commentInterval);
  }, [open]);

  const handleReaction = (emoji: string) => {
    const id = ++reactionIdRef.current;
    const x = Math.random() * 60 + 20; // 20–80%
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  const handleEndLive = () => {
    setIsEnding(true);
    setTimeout(() => {
      onOpenChange(false);
      setIsEnding(false);
      toast.success(
        `Your live has ended. ${finalViewerCount.current || viewerCount} viewers watched.`,
      );
    }, 800);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[95dvh] rounded-t-3xl p-0 overflow-hidden border-none"
        data-ocid="live.stream.sheet"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.14 0.025 295), oklch(0.12 0.02 340), oklch(0.13 0.018 225))",
        }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Live Stream</SheetTitle>
        </SheetHeader>

        {/* Floating reactions */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <AnimatePresence>
            {floatingReactions.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 1, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, y: -200, scale: 1.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute bottom-40 text-3xl"
                style={{ left: `${r.x}%` }}
              >
                {r.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Ambient blobs */}
        <div
          className="absolute top-1/4 left-1/4 w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.62 0.22 295)" }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-44 h-44 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.65 0.25 350)" }}
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3">
          {/* LIVE badge */}
          <motion.div
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "oklch(0.55 0.25 18)" }}
          >
            <div className="w-2 h-2 rounded-full bg-white" />
            <span className="text-white text-xs font-bold tracking-widest">
              LIVE
            </span>
          </motion.div>

          {/* Viewer count */}
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Users size={13} className="text-white/80" />
            <motion.span
              key={viewerCount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-white text-sm font-bold font-display"
            >
              {viewerCount}
            </motion.span>
            <span className="text-white/60 text-xs">watching</span>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={handleEndLive}
            className="bg-black/30 backdrop-blur-sm text-white/80 hover:text-white p-2 rounded-full transition-colors"
            aria-label="Close"
            data-ocid="live.stream.close_button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera simulation area */}
        <div className="relative z-10 mx-5 rounded-2xl overflow-hidden aspect-[9/16] max-h-[38dvh]">
          <div
            className="w-full h-full flex flex-col items-center justify-center"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.18 0.022 295), oklch(0.14 0.015 270))",
            }}
          >
            {/* Pulsing ring */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 0.5, 0.8] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="w-20 h-20 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: "oklch(0.62 0.22 295 / 0.6)" }}
            >
              <div
                className="w-14 h-14 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.62 0.22 295 / 0.3), oklch(0.65 0.25 350 / 0.3))",
                }}
              />
            </motion.div>
            <p className="text-white/60 text-sm mt-3 font-display">
              You're live!
            </p>
          </div>

          {/* Action buttons overlay */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => toast.info("Feature coming soon!")}
              data-ocid="live.stream.invite.button"
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
              aria-label="Invite friend"
            >
              <UserPlus size={16} />
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                } catch {
                  toast.info("Share your live stream");
                }
              }}
              data-ocid="live.stream.share.button"
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
              aria-label="Share"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Live comments */}
        <div className="relative z-10 px-5 mt-3 space-y-1.5 h-[100px] overflow-hidden">
          <AnimatePresence initial={false}>
            {visibleComments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div
                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                  }}
                >
                  {c.user[0].toUpperCase()}
                </div>
                <p className="text-sm text-white/90">
                  <span className="font-semibold text-white">{c.user}</span>{" "}
                  {c.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Emoji reaction bar */}
        <div className="relative z-10 px-5 mt-4">
          <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm rounded-2xl px-4 py-3">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReaction(emoji)}
                data-ocid="live.stream.toggle"
                className="text-2xl active:scale-75 transition-transform hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* End Live button */}
        <div className="relative z-10 px-5 mt-4">
          <motion.button
            type="button"
            onClick={handleEndLive}
            data-ocid="live.stream.delete_button"
            className="w-full h-12 rounded-2xl font-bold font-display text-white text-sm transition-all active:scale-95"
            animate={
              isEnding
                ? { scale: 0.95, opacity: 0.7 }
                : { scale: 1, opacity: 1 }
            }
            style={{ background: "oklch(0.55 0.25 18 / 0.8)" }}
          >
            {isEnding ? "Ending live..." : "End Live"}
          </motion.button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
