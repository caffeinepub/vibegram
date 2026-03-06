import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  Copy,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Share2,
  UserMinus,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Post } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetUserProfile,
  usePostComments,
  usePostLikes,
  useToggleLike,
} from "../hooks/useQueries";
import { formatCount, formatRelativeTime } from "../utils/helpers";
import { AvatarWithRing } from "./AvatarWithRing";

const SAVED_POSTS_KEY = "vg_saved_posts";
const VG_BLOCKED_KEY = "vg_blocked_users";

function getSavedPosts(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_POSTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function toggleSavedPost(postId: string): boolean {
  const saved = getSavedPosts();
  const idx = saved.indexOf(postId);
  let next: string[];
  if (idx >= 0) {
    next = saved.filter((id) => id !== postId);
  } else {
    next = [...saved, postId];
  }
  localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(next));
  return idx < 0;
}

/** Parse caption metadata markers */
function parseCaption(raw: string) {
  let caption = raw;
  let collabUser = "";
  let location = "";
  let taggedUsers: string[] = [];

  const collabMatch = caption.match(/^__collab__(@[\w]+)__/);
  if (collabMatch) {
    collabUser = collabMatch[1];
    caption = caption.slice(collabMatch[0].length);
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

  return { caption: caption.trim(), collabUser, location, taggedUsers };
}

/** Render caption text with @mentions highlighted in purple */
function CaptionWithMentions({ text }: { text: string }) {
  // Split by @username pattern
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^@\w+$/.test(part) ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: static caption parts
          <span key={i} className="text-vibe-purple font-semibold">
            {part}
          </span>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: static caption parts
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

interface PostCardProps {
  post: Post;
  index: number;
  onCommentClick: (post: Post) => void;
  onPostClick?: (post: Post) => void;
}

export function PostCard({
  post,
  index,
  onCommentClick,
  onPostClick,
}: PostCardProps) {
  const { identity } = useInternetIdentity();
  const { data: author } = useGetUserProfile(post.authorId);
  const { data: likes = [] } = usePostLikes(post.id);
  const { data: comments = [] } = usePostComments(post.id);
  const toggleLike = useToggleLike();
  const [heartAnimation, setHeartAnimation] = useState(false);
  const [isSaved, setIsSaved] = useState(() =>
    getSavedPosts().includes(post.id.toString()),
  );

  const currentPrincipal = identity?.getPrincipal();
  const isLiked = currentPrincipal
    ? likes.some((id) => id.toString() === currentPrincipal.toString())
    : false;

  const handleLike = useCallback(() => {
    if (!identity) return;
    setHeartAnimation(true);
    setTimeout(() => setHeartAnimation(false), 400);
    toggleLike.mutate(post.id);
  }, [identity, post.id, toggleLike]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: window.location.href });
      } catch {
        // User cancelled
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

  const handleBookmark = useCallback(() => {
    const nowSaved = toggleSavedPost(post.id.toString());
    setIsSaved(nowSaved);
    toast.success(nowSaved ? "Post saved!" : "Removed from saved");
  }, [post.id]);

  const handleReport = useCallback(() => {
    toast.success("Post reported. Thank you for keeping VibeGram safe.");
  }, []);

  const handleBlockUser = useCallback(() => {
    if (!author?.username) return;
    try {
      const blocked = JSON.parse(
        localStorage.getItem(VG_BLOCKED_KEY) || "[]",
      ) as string[];
      if (!blocked.includes(author.username)) {
        blocked.push(author.username);
        localStorage.setItem(VG_BLOCKED_KEY, JSON.stringify(blocked));
      }
    } catch {
      /* ignore */
    }
    toast.success(`@${author.username} blocked`);
  }, [author]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  }, []);

  const mediaUrl = post.media?.getDirectURL();

  // Parse caption metadata
  const {
    caption: displayCaption,
    collabUser,
    location,
    taggedUsers,
  } = parseCaption(post.caption || "");

  return (
    <article
      className="bg-card rounded-2xl overflow-hidden border border-border animate-fade-in"
      data-ocid={`feed.post.item.${index}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <AvatarWithRing profile={author} size="sm" showRing />
          <div>
            <p className="text-sm font-semibold font-display leading-none">
              {author?.displayName || author?.username || "..."}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {collabUser ? (
                <>
                  @{author?.username || "..."}{" "}
                  <span className="text-muted-foreground">×</span>{" "}
                  <span className="gradient-text font-semibold">
                    {collabUser}
                  </span>
                </>
              ) : (
                <>@{author?.username || "..."}</>
              )}{" "}
              · {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>

        {/* More options menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="More options"
              data-ocid="post.more.button"
            >
              <MoreHorizontal size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 bg-card border-border rounded-xl shadow-glass"
            data-ocid="post.options.dropdown_menu"
          >
            <DropdownMenuItem
              onClick={handleCopyLink}
              className="flex items-center gap-2.5 cursor-pointer rounded-lg text-sm"
              data-ocid="post.copy_link.button"
            >
              <Copy size={14} className="text-muted-foreground" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleReport}
              className="flex items-center gap-2.5 cursor-pointer rounded-lg text-sm"
              data-ocid="post.report.button"
            >
              <Flag size={14} className="text-muted-foreground" />
              Report Post
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleBlockUser}
              className="flex items-center gap-2.5 cursor-pointer rounded-lg text-sm text-destructive focus:text-destructive"
              data-ocid="post.block.button"
            >
              <UserMinus size={14} />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media — clickable to open post detail */}
      <button
        type="button"
        className="relative bg-secondary aspect-square w-full overflow-hidden block cursor-pointer"
        onClick={() => onPostClick?.(post)}
        aria-label="View post"
        data-ocid="post.media.button"
      >
        {mediaUrl ? (
          post.mediaType === "video" ? (
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
          ) : (
            <img
              src={mediaUrl}
              alt={post.caption}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full gradient-bg opacity-30" />
        )}
      </button>

      {/* Location chip */}
      {location && (
        <div className="flex items-center gap-1 px-4 pt-2 text-xs text-muted-foreground">
          <MapPin size={11} />
          <span>{location}</span>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-3">
          {/* Like */}
          <button
            type="button"
            onClick={handleLike}
            data-ocid="post.like.button"
            className={cn(
              "flex items-center gap-1.5 transition-all",
              isLiked
                ? "text-vibe-pink"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={isLiked ? "Unlike post" : "Like post"}
          >
            <div
              className={cn(
                "rounded-full p-1 -m-1 transition-all duration-200",
                isLiked ? "neon-pink-glow" : "",
              )}
            >
              <Heart
                size={22}
                className={cn(
                  "transition-all",
                  isLiked ? "fill-current" : "",
                  heartAnimation ? "animate-heartbeat" : "",
                )}
              />
            </div>
            <span className="text-sm font-semibold">
              {formatCount(likes.length)}
            </span>
          </button>

          {/* Comment */}
          <button
            type="button"
            onClick={() => onCommentClick(post)}
            data-ocid="post.comment.button"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View comments"
          >
            <MessageCircle size={22} />
            {comments.length > 0 && (
              <span className="text-sm font-semibold">
                {formatCount(comments.length)}
              </span>
            )}
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            data-ocid="post.share.button"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Share post"
          >
            <Share2 size={21} />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bookmark */}
          <button
            type="button"
            onClick={handleBookmark}
            data-ocid="post.save.button"
            className={cn(
              "flex items-center gap-1.5 transition-all",
              isSaved
                ? "text-vibe-purple"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={isSaved ? "Remove bookmark" : "Save post"}
          >
            <Bookmark
              size={21}
              className={cn("transition-all", isSaved ? "fill-current" : "")}
            />
          </button>
        </div>

        {/* Caption */}
        {displayCaption && (
          <p className="text-sm leading-relaxed">
            <span className="font-semibold mr-1.5">{author?.username}</span>
            <span className="text-foreground/90 line-clamp-2">
              <CaptionWithMentions text={displayCaption} />
            </span>
          </p>
        )}

        {/* Tagged users */}
        {taggedUsers.length > 0 && (
          <p className="text-xs text-muted-foreground">
            with{" "}
            {taggedUsers.map((u, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static tag list
              <span key={i}>
                <span className="text-vibe-purple font-semibold">{u}</span>
                {i < taggedUsers.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="aspect-square w-full" />
      <div className="px-4 py-3 space-y-2">
        <div className="flex gap-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-8" />
          <div className="flex-1" />
          <Skeleton className="h-6 w-8" />
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
