import { Eye, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Post } from "../backend.d";
import { useGetUserProfile } from "../hooks/useQueries";
import { formatRelativeTime } from "../utils/helpers";
import { AvatarWithRing } from "./AvatarWithRing";

interface StoryViewerProps {
  stories: Post[];
  startIndex: number;
  open: boolean;
  onClose: () => void;
}

function StoryAuthorInfo({ post }: { post: Post }) {
  const { data: profile } = useGetUserProfile(post.authorId);
  const isCloseFriend = post.caption?.startsWith("__cf__");

  return (
    <div className="flex items-center gap-2.5 flex-1 min-w-0">
      <div
        className={`rounded-full p-[2px] shrink-0 ${isCloseFriend ? "" : ""}`}
        style={
          isCloseFriend
            ? { background: "oklch(0.55 0.2 150)" }
            : {
                background:
                  "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
              }
        }
      >
        <div className="rounded-full bg-black/20 p-[1px]">
          <AvatarWithRing
            profile={profile}
            size="sm"
            showRing={false}
            className="shrink-0"
          />
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white text-sm font-semibold font-display leading-none truncate drop-shadow">
            {profile?.displayName || profile?.username || ""}
          </p>
          {isCloseFriend && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white"
              style={{ background: "oklch(0.55 0.2 150)" }}
            >
              CF
            </span>
          )}
        </div>
        <p className="text-white/70 text-xs mt-0.5 drop-shadow">
          {formatRelativeTime(post.createdAt)}
        </p>
      </div>
    </div>
  );
}

const STORY_DURATION_MS = 5000;
const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "🔥"];

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
}

export function StoryViewer({
  stories,
  startIndex,
  open,
  onClose,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [showViews, setShowViews] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<
    FloatingReaction[]
  >([]);
  const reactionIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentStory = stories[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (open) {
      setCurrentIndex(startIndex);
      setProgress(0);
      setShowViews(false);
    }
  }, [open, startIndex]);

  useEffect(() => {
    if (!open || !currentStory) return;

    setProgress(0);
    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        goNext();
      }
    };

    timerRef.current = setInterval(tick, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, currentStory, goNext]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      goPrev();
    } else {
      goNext();
    }
  };

  const handleReaction = (emoji: string) => {
    const id = ++reactionIdRef.current;
    const x = Math.random() * 60 + 20;
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  if (!open) return null;

  const mediaUrl = currentStory?.media?.getDirectURL();
  const isVideo = currentStory?.mediaType === "video";

  // Mock view count (deterministic based on story index)
  const mockViewCount = currentIndex * 7 + 12;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.95)" }}
          data-ocid="story.viewer.modal"
        >
          {/* Phone frame constraint */}
          <div className="relative w-full max-w-[430px] h-full overflow-hidden">
            {/* Floating reactions */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              <AnimatePresence>
                {floatingReactions.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 1, y: 0, scale: 0.8 }}
                    animate={{ opacity: 0, y: -180, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute bottom-32 text-3xl"
                    style={{ left: `${r.x}%` }}
                  >
                    {r.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Media - tap areas */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: tap to navigate is intentional touch UX */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={handleTap}
            >
              {mediaUrl ? (
                isVideo ? (
                  <video
                    key={currentStory?.id.toString()}
                    src={mediaUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                    loop
                  />
                ) : (
                  <img
                    key={currentStory?.id.toString()}
                    src={mediaUrl}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full gradient-bg" />
              )}
            </div>

            {/* Gradient overlays */}
            <div
              className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
              }}
            />

            {/* Top bar: progress + user info */}
            <div className="absolute top-0 left-0 right-0 px-3 pt-3 z-10 pointer-events-none">
              <div className="flex gap-1 pb-2">
                {stories.map((story, idx) => (
                  <div
                    key={story.id.toString()}
                    className="flex-1 h-0.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.3)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: "white",
                        width:
                          idx < currentIndex
                            ? "100%"
                            : idx === currentIndex
                              ? `${progress}%`
                              : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                {currentStory && <StoryAuthorInfo post={currentStory} />}
                {/* Views button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowViews((v) => !v);
                  }}
                  className="text-white/70 hover:text-white p-1.5 transition-colors shrink-0"
                  aria-label="Story views"
                  data-ocid="story.views.button"
                >
                  <Eye size={18} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white/80 hover:text-white p-1.5 transition-colors shrink-0"
                  aria-label="Close story"
                  data-ocid="story.viewer.close_button"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Views panel */}
            <AnimatePresence>
              {showViews && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute top-16 left-3 right-3 z-20 rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(0,0,0,0.8)",
                    backdropFilter: "blur(16px)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye size={16} className="text-white/70" />
                      <p className="text-white text-sm font-semibold">
                        {mockViewCount} views
                      </p>
                    </div>
                    {mockViewCount === 0 ? (
                      <p className="text-white/50 text-xs">
                        Be the first to view!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {["vibefan99", "creative_soul", "photo_lover"]
                          .slice(0, Math.min(3, mockViewCount))
                          .map((u) => (
                            <div key={u} className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{
                                  background:
                                    "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                                }}
                              >
                                {u[0].toUpperCase()}
                              </div>
                              <p className="text-white/80 text-sm">@{u}</p>
                            </div>
                          ))}
                        {mockViewCount > 3 && (
                          <p className="text-white/50 text-xs">
                            +{mockViewCount - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom: emoji reactions + reply */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 z-10 space-y-2.5">
              {/* Emoji reactions */}
              <div className="flex items-center justify-center gap-3">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction(emoji);
                    }}
                    data-ocid="story.reaction.toggle"
                    className="text-xl active:scale-75 transition-transform hover:scale-125 w-10 h-10 flex items-center justify-center rounded-full"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply input */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply to story..."
                  className="flex-1 bg-white/10 backdrop-blur-md text-white placeholder:text-white/50 text-sm px-4 py-2.5 rounded-full border border-white/20 outline-none focus:border-white/40 transition-colors"
                  data-ocid="story.reply.input"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (replyText.trim()) {
                      toast.success("Reply sent!");
                      setReplyText("");
                    }
                  }}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors shrink-0"
                  data-ocid="story.reply.button"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
