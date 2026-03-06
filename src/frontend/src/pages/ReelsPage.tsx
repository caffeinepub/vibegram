import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronUp,
  Download,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Music2,
  Pause,
  Play,
  Send,
  Share2,
  UserPlus,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Comment, Post } from "../backend.d";
import { AvatarWithRing } from "../components/AvatarWithRing";
import { ALL_SONGS } from "../components/CreativeToolbar";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateComment,
  useExploreFeed,
  useFollowUser,
  useGetUserProfile,
  usePostComments,
  usePostLikes,
  useToggleLike,
} from "../hooks/useQueries";
import { formatCount, formatRelativeTime } from "../utils/helpers";

// ─── Caption Parser ───────────────────────────────────────────────────────────

function parseReelCaption(raw: string) {
  let caption = raw;
  let collabUser = "";
  let location = "";
  let taggedUsers: string[] = [];
  let songTitle = "";
  let songArtist = "";

  // Handle both __collab__ and __reelcollab__ prefixes
  const collabMatch = caption.match(/^__(?:reel)?collab__(@[\w]+)__/);
  if (collabMatch) {
    collabUser = collabMatch[1];
    caption = caption.slice(collabMatch[0].length);
  }

  // Extract song prefix: __song__Title - Artist__
  const songMatch = caption.match(/__song__(.*?) - (.*?)__/);
  if (songMatch) {
    songTitle = songMatch[1];
    songArtist = songMatch[2];
    caption = caption.replace(songMatch[0], "");
  }

  const locMatch = caption.match(/__loc__(.*?)__/);
  if (locMatch) {
    location = locMatch[1];
    caption = caption.replace(locMatch[0], "");
  }

  const tagsMatch = caption.match(/__tags__(.*?)__/);
  if (tagsMatch) {
    taggedUsers = tagsMatch[1].split(",").filter(Boolean);
    caption = caption.replace(tagsMatch[0], "");
  }

  if (caption.startsWith("__reel__")) caption = caption.slice(8);
  if (caption === "__story__") caption = "";

  return {
    caption: caption.trim(),
    collabUser,
    location,
    taggedUsers,
    songTitle,
    songArtist,
  };
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

function ReelCommentItem({ comment }: { comment: Comment }) {
  const { data: author } = useGetUserProfile(comment.authorId);
  return (
    <div className="flex gap-3 py-3 px-4">
      <AvatarWithRing profile={author} size="xs" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-white">
            {author?.username || "..."}
          </span>
          <span className="text-xs text-white/40">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-white/80 mt-0.5 leading-relaxed">
          {comment.text}
        </p>
      </div>
    </div>
  );
}

// ─── Single Reel Card ─────────────────────────────────────────────────────────

interface ReelCardProps {
  post: Post;
  isActive: boolean;
}

function ReelCard({ post, isActive }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  const { identity } = useInternetIdentity();
  const { data: author } = useGetUserProfile(post.authorId);
  const { data: likes = [] } = usePostLikes(post.id);
  const { data: comments = [] } = usePostComments(post.id);
  const toggleLike = useToggleLike();
  const followUser = useFollowUser();
  const createComment = useCreateComment();
  const navigate = useNavigate();

  // UI state
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [songPickerOpen, setSongPickerOpen] = useState(false);
  const [songSearch, setSongSearch] = useState("");
  const [pickedSong, setPickedSong] = useState<{
    title: string;
    artist: string;
  } | null>(null);

  const currentPrincipal = identity?.getPrincipal();
  const isLiked = currentPrincipal
    ? likes.some((id) => id.toString() === currentPrincipal.toString())
    : false;

  // Auto-play / pause based on active state
  // biome-ignore lint/correctness/useExhaustiveDependencies: isMuted is intentionally excluded; mute state is managed imperatively on the video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.currentTime = 0;
      video.muted = isMuted;
      video.play().catch(() => {
        // Autoplay blocked
      });
      setIsPaused(false);
    } else {
      video.pause();
    }
  }, [isActive]);

  // Progress bar RAF loop
  useEffect(() => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar || !isActive) return;

    const tick = () => {
      if (video.duration > 0) {
        const pct = (video.currentTime / video.duration) * 100;
        bar.style.width = `${pct}%`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive]);

  const handleLike = useCallback(() => {
    if (!identity) return;
    toggleLike.mutate(post.id);
  }, [identity, post.id, toggleLike]);

  const handleDoubleTap = useCallback(() => {
    if (!identity) return;
    toggleLike.mutate(post.id);
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 700);
  }, [identity, post.id, toggleLike]);

  const handleVideoTap = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTapRef.current;
    lastTapRef.current = now;

    if (delta < 300) {
      // Double tap
      handleDoubleTap();
      return;
    }

    // Single tap: toggle play/pause
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 800);
  }, [handleDoubleTap]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: window.location.href });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied!");
      } catch {
        toast.error("Could not copy link");
      }
    }
  }, []);

  const handleFollow = useCallback(() => {
    if (!post.authorId) return;
    followUser.mutate(post.authorId);
    toast.success("Following!");
  }, [post.authorId, followUser]);

  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim()) return;
    await createComment.mutateAsync({ postId: post.id, text: commentText });
    setCommentText("");
  }, [commentText, createComment, post.id]);

  const mediaUrl = post.media?.getDirectURL();

  // Parse caption metadata
  const {
    caption: displayCaption,
    collabUser,
    location,
    taggedUsers,
    songTitle: captionSongTitle,
    songArtist: captionSongArtist,
  } = parseReelCaption(post.caption || "");

  // Resolved song: picked by user in viewer OR parsed from caption
  const activeSong =
    pickedSong ??
    (captionSongTitle
      ? { title: captionSongTitle, artist: captionSongArtist }
      : null);

  // Filtered songs for picker
  const filteredPickerSongs = ALL_SONGS.filter((s) => {
    const q = songSearch.toLowerCase();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  });

  const handleDownload = useCallback(async () => {
    if (!mediaUrl) {
      toast.error("Video not available");
      return;
    }
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `vibegrom_reel_${post.id.toString()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast.success("Reel saved!");
    } catch {
      toast.error("Download failed");
    }
  }, [mediaUrl, post.id]);

  return (
    <div
      className="relative w-full flex-shrink-0"
      style={{ height: "100dvh" }}
      data-ocid="reel.item.card"
    >
      {/* Video progress bar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 h-[3px] bg-white/20"
        style={{ pointerEvents: "none" }}
      >
        <div
          ref={progressRef}
          className="h-full w-0 transition-none"
          style={{ background: "oklch(0.62 0.28 340)" }}
        />
      </div>

      {/* Video / placeholder — full-screen tap area */}
      <button
        type="button"
        className="absolute inset-0 bg-black cursor-pointer w-full h-full border-0 p-0"
        onClick={handleVideoTap}
        aria-label="Tap to play/pause, double tap to like"
      >
        {mediaUrl ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={isMuted}
          />
        ) : (
          <div className="w-full h-full gradient-bg opacity-30" />
        )}
      </button>

      {/* Gradient overlay bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2/3 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 35%, transparent 55%)",
        }}
      />

      {/* Mute/unmute toggle - top right */}
      <button
        type="button"
        onClick={handleMuteToggle}
        data-ocid="reel.mute.button"
        className="absolute top-14 right-4 z-30 bg-black/40 backdrop-blur-sm rounded-full p-2 text-white"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Center play/pause flash */}
      {showPlayIcon && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="bg-black/50 backdrop-blur-sm rounded-full p-5"
          >
            {isPaused ? (
              <Pause size={36} className="text-white fill-white" />
            ) : (
              <Play size={36} className="text-white fill-white" />
            )}
          </motion.div>
        </div>
      )}

      {/* Double-tap heart burst */}
      {showHeartBurst && (
        <div
          className="absolute left-1/2 top-1/2 z-20 pointer-events-none animate-heart-burst"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <Heart
            size={90}
            className="fill-current drop-shadow-2xl"
            style={{ color: "oklch(0.62 0.28 340)" }}
          />
        </div>
      )}

      {/* Right actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-20">
        {/* Like */}
        <button
          type="button"
          onClick={handleLike}
          data-ocid="reel.like.button"
          className="flex flex-col items-center gap-1"
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <div
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200",
              isLiked ? "neon-pink-glow" : "",
            )}
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <Heart
              size={24}
              className={cn(
                "transition-all",
                isLiked ? "fill-current" : "text-white",
              )}
              style={isLiked ? { color: "oklch(0.62 0.28 340)" } : undefined}
            />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">
            {formatCount(likes.length)}
          </span>
        </button>

        {/* Comment */}
        <button
          type="button"
          data-ocid="reel.comment.button"
          className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
          aria-label="Comments"
          onClick={() => setCommentsOpen(true)}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center neon-purple-glow transition-all duration-200"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <MessageCircle size={24} className="text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">
            {formatCount(comments.length)}
          </span>
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          data-ocid="reel.share.button"
          className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
          aria-label="Share"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center hover:neon-blue-glow transition-all duration-200"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <Share2 size={22} className="text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">
            Share
          </span>
        </button>

        {/* Download */}
        <button
          type="button"
          onClick={handleDownload}
          data-ocid="reel.download.button"
          className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
          aria-label="Download reel"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <Download size={22} className="text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">
            Save
          </span>
        </button>

        {/* Author avatar */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() =>
              navigate({ to: `/user/${post.authorId.toString()}` })
            }
            className="relative"
            aria-label="View author profile"
          >
            <AvatarWithRing profile={author} size="md" showRing />
          </button>
          {/* Follow + button */}
          <button
            type="button"
            onClick={handleFollow}
            data-ocid="reel.follow.button"
            className="w-5 h-5 rounded-full flex items-center justify-center -mt-2.5 z-10 relative"
            style={{ background: "oklch(0.62 0.22 295)" }}
            aria-label="Follow creator"
          >
            <UserPlus size={11} className="text-white" />
          </button>
        </div>
      </div>

      {/* Bottom author info + caption */}
      <div className="absolute bottom-24 left-4 right-20 z-20 space-y-2">
        <div className="flex items-center gap-2">
          {/* Tappable music disc — opens song picker */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSongPickerOpen(true);
            }}
            data-ocid="reel.song.button"
            className="text-sm animate-spin-disc select-none focus:outline-none"
            aria-label="Pick a song"
          >
            🎵
          </button>
          <button
            type="button"
            onClick={() =>
              navigate({ to: `/user/${post.authorId.toString()}` })
            }
            className="flex items-center gap-1"
            aria-label="View author profile"
          >
            <span className="text-white font-bold font-display text-sm drop-shadow">
              @{author?.username || "..."}
              {collabUser && (
                <>
                  {" "}
                  <span className="text-white/60">×</span>{" "}
                  <span style={{ color: "oklch(0.75 0.22 295)" }}>
                    {collabUser}
                  </span>
                </>
              )}
            </span>
          </button>
        </div>

        {/* Song marquee */}
        {activeSong && (
          <div className="flex items-center gap-1.5 overflow-hidden max-w-[200px]">
            <Music2 size={11} className="text-white/70 shrink-0" />
            <div className="overflow-hidden">
              <p
                className="text-white/80 text-xs whitespace-nowrap"
                style={{ animation: "marquee 8s linear infinite" }}
              >
                ♪ {activeSong.title} — {activeSong.artist}
              </p>
            </div>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-1 text-white/70 text-xs">
            <MapPin size={11} />
            <span>{location}</span>
          </div>
        )}
        {displayCaption && (
          <p className="text-white/90 text-sm leading-relaxed drop-shadow line-clamp-3">
            {displayCaption}
          </p>
        )}
        {taggedUsers.length > 0 && (
          <p className="text-white/60 text-xs">
            with{" "}
            {taggedUsers.map((u, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static tag list
              <span key={i} className="text-white/80 font-semibold">
                {u}
                {i < taggedUsers.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* Song picker bottom sheet */}
      <Sheet open={songPickerOpen} onOpenChange={setSongPickerOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-t border-white/10 p-0"
          style={{ height: "60vh", background: "oklch(0.1 0.015 265)" }}
          data-ocid="reel.song_picker.sheet"
        >
          <SheetHeader className="px-4 py-3 border-b border-white/10 flex-row items-center justify-between space-y-0">
            <SheetTitle className="text-white text-base font-semibold flex items-center gap-2">
              <Music2 size={16} style={{ color: "oklch(0.75 0.22 295)" }} />
              Pick a Song
            </SheetTitle>
            <button
              type="button"
              onClick={() => setSongPickerOpen(false)}
              className="text-white/50 hover:text-white transition-colors"
              aria-label="Close song picker"
              data-ocid="reel.song_picker.close_button"
            >
              <X size={18} />
            </button>
          </SheetHeader>

          {/* Search */}
          <div className="px-4 py-2.5 border-b border-white/10">
            <Input
              data-ocid="reel.song_picker.search_input"
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              placeholder="Search songs or artists..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm h-9"
            />
          </div>

          <ScrollArea style={{ height: "calc(60vh - 130px)" }}>
            {/* Remove song option */}
            {pickedSong && (
              <button
                type="button"
                onClick={() => {
                  setPickedSong(null);
                  setSongPickerOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5"
                data-ocid="reel.song_picker.remove_button"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-red-500/20">
                  <X size={14} className="text-red-400" />
                </div>
                <span className="text-red-400 text-sm font-medium">
                  Remove Song
                </span>
              </button>
            )}

            {filteredPickerSongs.map((song, i) => {
              const isSelected =
                pickedSong?.title === song.title &&
                pickedSong?.artist === song.artist;
              return (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable song list
                  key={i}
                  type="button"
                  onClick={() => {
                    setPickedSong(
                      isSelected
                        ? null
                        : { title: song.title, artist: song.artist },
                    );
                    setSongPickerOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm"
                    style={{ background: "oklch(0.62 0.22 295 / 0.25)" }}
                  >
                    🎵
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {song.title}
                    </p>
                    <p className="text-white/50 text-xs truncate">
                      {song.artist}
                    </p>
                  </div>
                  {isSelected && (
                    <Check
                      size={16}
                      style={{ color: "oklch(0.75 0.22 295)" }}
                      className="shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Comments bottom sheet */}
      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-t border-white/10 p-0"
          style={{
            height: "70vh",
            background: "oklch(0.12 0.018 265)",
          }}
          data-ocid="reel.comments.sheet"
        >
          <SheetHeader className="px-4 py-3 border-b border-white/10">
            <SheetTitle className="text-white text-base font-semibold">
              Comments
              <span className="ml-2 text-white/50 text-sm font-normal">
                ({formatCount(comments.length)})
              </span>
            </SheetTitle>
          </SheetHeader>

          <ScrollArea
            className="flex-1"
            style={{ height: "calc(70vh - 120px)" }}
          >
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <MessageCircle size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No comments yet</p>
                <p className="text-xs mt-1">Be the first to comment!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {comments.map((comment, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable index within reel session
                  <ReelCommentItem key={i} comment={comment} />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Comment input */}
          <div className="px-4 py-3 border-t border-white/10 flex gap-2">
            <Input
              data-ocid="reel.comment.input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <Button
              size="icon"
              data-ocid="reel.comment.submit_button"
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || createComment.isPending}
              className="btn-gradient shrink-0"
              aria-label="Send comment"
            >
              {createComment.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Reels Page ───────────────────────────────────────────────────────────────

export function ReelsPage() {
  const { data: posts = [], isLoading } = useExploreFeed();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  // Filter reels (videos or posts with __reel__ caption)
  const reelPosts = posts.filter(
    (p) =>
      p.caption.startsWith("__reel__") ||
      (p.mediaType === "video" &&
        p.caption !== "__story__" &&
        !p.caption.startsWith("__reel__")),
  );

  // Intersection observer to track active reel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.reelIndex);
            setActiveIndex(idx);
            if (idx > 0) {
              setShowSwipeHint(false);
            }
          }
        }
      },
      { threshold: 0.6 },
    );

    const children = container.querySelectorAll("[data-reel-index]");
    for (const child of children) {
      observer.observe(child);
    }

    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hide swipe hint on first scroll
  const handleScroll = useCallback(() => {
    setShowSwipeHint(false);
  }, []);

  return (
    <div
      className="relative min-h-screen bg-black"
      style={{ paddingBottom: "var(--nav-height)" }}
    >
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate({ to: "/" })}
        data-ocid="reels.back.button"
        className="fixed top-4 left-4 z-50 bg-black/40 backdrop-blur-sm text-white rounded-full p-2 transition-colors hover:bg-black/60"
        aria-label="Back to home"
      >
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative back arrow */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </button>

      {/* REELS badge */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <span className="text-white font-bold font-display text-lg drop-shadow-lg tracking-wide">
          Reels
        </span>
      </div>

      {isLoading ? (
        <div
          className="flex items-center justify-center h-screen"
          data-ocid="reels.loading_state"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white"
          />
        </div>
      ) : reelPosts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center h-screen text-center px-6"
          data-ocid="reels.empty_state"
        >
          <div className="gradient-bg rounded-3xl p-6 mb-5">
            <span className="text-4xl">🎬</span>
          </div>
          <h3 className="text-white text-xl font-bold font-display mb-2">
            No reels yet
          </h3>
          <p className="text-white/60 text-sm leading-relaxed">
            Be the first to share a reel using the Create button
          </p>
        </div>
      ) : (
        /* Snap scroll container */
        <>
          <div
            ref={containerRef}
            className="overflow-y-scroll scrollbar-none"
            style={{
              height: "calc(100dvh - var(--nav-height))",
              scrollSnapType: "y mandatory",
              overscrollBehavior: "contain",
            }}
            onScroll={handleScroll}
          >
            {reelPosts.map((post: Post, idx: number) => (
              <div
                key={post.id.toString()}
                data-reel-index={idx}
                style={{
                  scrollSnapAlign: "start",
                  scrollSnapStop: "always",
                }}
              >
                <ReelCard post={post} isActive={activeIndex === idx} />
              </div>
            ))}
          </div>

          {/* Swipe up hint */}
          <div
            data-ocid="reels.swipe_hint"
            className={cn(
              "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 pointer-events-none transition-opacity duration-500",
              showSwipeHint ? "opacity-100" : "opacity-0",
            )}
            aria-hidden="true"
          >
            <ChevronUp size={28} className="text-white animate-swipe-hint" />
            <span className="text-white/70 text-xs font-medium tracking-wide">
              Swipe up
            </span>
          </div>
        </>
      )}
    </div>
  );
}
