import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Post } from "../backend.d";
import { AvatarWithRing } from "../components/AvatarWithRing";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useExploreFeed,
  useFollowUser,
  useGetUserProfile,
  usePostComments,
  usePostLikes,
  useToggleLike,
} from "../hooks/useQueries";
import { formatCount } from "../utils/helpers";

// ─── Single Reel Card ─────────────────────────────────────────────────────────

interface ReelCardProps {
  post: Post;
  isActive: boolean;
}

function ReelCard({ post, isActive }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { identity } = useInternetIdentity();
  const { data: author } = useGetUserProfile(post.authorId);
  const { data: likes = [] } = usePostLikes(post.id);
  const { data: comments = [] } = usePostComments(post.id);
  const toggleLike = useToggleLike();
  const followUser = useFollowUser();
  const navigate = useNavigate();

  const [heartAnim, setHeartAnim] = useState(false);

  const currentPrincipal = identity?.getPrincipal();
  const isLiked = currentPrincipal
    ? likes.some((id) => id.toString() === currentPrincipal.toString())
    : false;

  // Auto-play / pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.currentTime = 0;
      video.play().catch(() => {
        // Autoplay blocked — show controls
      });
    } else {
      video.pause();
    }
  }, [isActive]);

  const handleLike = useCallback(() => {
    if (!identity) return;
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 400);
    toggleLike.mutate(post.id);
  }, [identity, post.id, toggleLike]);

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

  const mediaUrl = post.media?.getDirectURL();

  // Extract caption: strip __reel__ prefix
  const displayCaption = post.caption.startsWith("__reel__")
    ? post.caption.slice(8)
    : post.caption;

  return (
    <div
      className="relative w-full flex-shrink-0"
      style={{ height: "100dvh" }}
      data-ocid="reel.item.card"
    >
      {/* Video */}
      <div className="absolute inset-0 bg-black">
        {mediaUrl ? (
          // biome-ignore lint/a11y/useMediaCaption: user-generated reel content, captions not available
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted
          />
        ) : (
          <div className="w-full h-full gradient-bg opacity-30" />
        )}
      </div>

      {/* Gradient overlay bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2/3 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
        }}
      />

      {/* Right actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-10">
        {/* Like */}
        <button
          type="button"
          onClick={handleLike}
          data-ocid="reel.like.button"
          className="flex flex-col items-center gap-1"
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <Heart
              size={24}
              className={cn(
                "transition-all",
                isLiked ? "fill-vibe-pink text-vibe-pink" : "text-white",
                heartAnim ? "animate-heartbeat" : "",
              )}
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
          className="flex flex-col items-center gap-1"
          aria-label="Comments"
          onClick={() => toast.info("Comments coming soon!")}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
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
          className="flex flex-col items-center gap-1"
          aria-label="Share"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <Share2 size={22} className="text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">
            Share
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
          >
            <UserPlus size={11} className="text-white" />
          </button>
        </div>
      </div>

      {/* Bottom author info + caption */}
      <div className="absolute bottom-24 left-4 right-20 z-10 space-y-2">
        <button
          type="button"
          onClick={() => navigate({ to: `/user/${post.authorId.toString()}` })}
          className="flex items-center gap-2"
        >
          <span className="text-white font-bold font-display text-sm drop-shadow">
            @{author?.username || "..."}
          </span>
        </button>
        {displayCaption && (
          <p className="text-white/90 text-sm leading-relaxed drop-shadow line-clamp-3">
            {displayCaption}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Reels Page ───────────────────────────────────────────────────────────────

export function ReelsPage() {
  const { data: posts = [], isLoading } = useExploreFeed();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
          }
        }
      },
      { threshold: 0.7 },
    );

    const children = container.querySelectorAll("[data-reel-index]");
    for (const child of children) {
      observer.observe(child);
    }

    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div
          ref={containerRef}
          className="overflow-y-scroll scrollbar-none"
          style={{
            height: "calc(100dvh - var(--nav-height))",
            scrollSnapType: "y mandatory",
            overscrollBehavior: "contain",
          }}
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
      )}
    </div>
  );
}
