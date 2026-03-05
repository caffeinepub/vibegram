import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Loader2, Play, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Post, UserId, UserProfile } from "../backend.d";
import { AvatarWithRing } from "../components/AvatarWithRing";
import { UserCard } from "../components/UserCard";
import {
  useExploreFeed,
  useFollowUser,
  useGetUserProfile,
  useSearchUsers,
  useUnfollowUser,
} from "../hooks/useQueries";

interface ExplorePostTileProps {
  post: Post;
}

function ExplorePostTile({ post }: ExplorePostTileProps) {
  const mediaUrl = post.media?.getDirectURL();
  return (
    <div className="aspect-square rounded-xl overflow-hidden bg-secondary relative group">
      {mediaUrl ? (
        post.mediaType === "video" ? (
          <div className="w-full h-full relative">
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/40 rounded-full p-2">
                {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative play icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <img
            src={mediaUrl}
            alt={post.caption}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        )
      ) : (
        <div className="w-full h-full gradient-bg opacity-40" />
      )}
    </div>
  );
}

/** Vertical reel thumbnail for horizontal scroll */
function ReelThumbnail({ post }: { post: Post }) {
  const mediaUrl = post.media?.getDirectURL();
  const caption = post.caption.startsWith("__reel__")
    ? post.caption.slice(8)
    : post.caption;

  return (
    <Link
      to="/reels"
      data-ocid="explore.reel.link"
      className="shrink-0 w-28 rounded-xl overflow-hidden relative"
      style={{ aspectRatio: "9/16" }}
    >
      <div className="w-full h-full bg-secondary relative">
        {mediaUrl ? (
          <video src={mediaUrl} className="w-full h-full object-cover" muted />
        ) : (
          <div className="w-full h-full gradient-bg opacity-50" />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-end justify-start p-2">
          <div className="bg-black/50 rounded-full p-1">
            <Play size={10} className="text-white fill-white" />
          </div>
        </div>
        {/* Caption */}
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 p-1.5">
            <p className="text-white text-[9px] leading-tight line-clamp-2 drop-shadow">
              {caption}
            </p>
          </div>
        )}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)",
          }}
        />
      </div>
    </Link>
  );
}

interface SuggestedUserRowProps {
  profile: UserProfile;
  index: number;
}

function SuggestedUserRow({ profile, index }: SuggestedUserRowProps) {
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const isPending = followUser.isPending || unfollowUser.isPending;
  const isFollowing = false;

  return (
    <div
      className="flex items-center gap-3 py-2.5"
      data-ocid={`explore.suggested.item.${index}`}
    >
      <AvatarWithRing profile={profile} size="md" showRing />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-display truncate">
          {profile.displayName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          @{profile.username}
        </p>
      </div>
      <Button
        size="sm"
        data-ocid={`explore.suggested.follow.button.${index}`}
        disabled={isPending}
        className={cn(
          "shrink-0 text-xs font-semibold h-8 px-4 rounded-full transition-all",
          isFollowing
            ? "bg-secondary text-foreground border border-border hover:bg-muted"
            : "btn-gradient text-white border-0",
        )}
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : isFollowing ? (
          "Following"
        ) : (
          "Follow"
        )}
      </Button>
    </div>
  );
}

function SuggestedUserRowById({
  userId,
  index,
}: {
  userId: UserId;
  index: number;
}) {
  const { data: profile } = useGetUserProfile(userId);
  if (!profile) return null;
  return <SuggestedUserRow profile={profile} index={index} />;
}

export function ExplorePage() {
  const [query, setQuery] = useState("");
  const { data: posts = [], isLoading: postsLoading } = useExploreFeed();
  const { data: searchResults = [], isLoading: searchLoading } =
    useSearchUsers(query);
  const isSearching = query.trim().length > 0;

  // Filter posts
  const regularPosts = posts.filter(
    (p) => p.caption !== "__story__" && !p.caption.startsWith("__reel__"),
  );
  const reelPosts = posts.filter(
    (p) =>
      p.caption.startsWith("__reel__") ||
      (p.mediaType === "video" &&
        p.caption !== "__story__" &&
        !p.caption.startsWith("__reel__")),
  );

  // Assign a deterministic "trending score" from post id
  const trendingPosts = [...regularPosts].sort(
    (a, b) => Number(b.id % BigInt(100)) - Number(a.id % BigInt(100)),
  );

  // Unique author IDs for suggestions, max 5
  const suggestedAuthorIds = posts
    .filter((p) => p.caption !== "__story__")
    .reduce<string[]>((seen, post) => {
      const key = post.authorId.toString();
      if (!seen.includes(key)) seen.push(key);
      return seen;
    }, [])
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 pt-4 pb-3 border-b border-border"
        style={{
          background: "oklch(0.14 0.008 260 / 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <h1 className="text-xl font-bold font-display mb-3">Explore</h1>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            data-ocid="explore.search.input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="pl-9 pr-9 bg-secondary border-border"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-3 py-4">
        {isSearching ? (
          <div>
            {searchLoading ? (
              <div className="space-y-3" data-ocid="explore.loading_state">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 text-center"
                data-ocid="explore.empty_state"
              >
                <span className="text-4xl mb-3">🔍</span>
                <p className="font-semibold">No users found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {searchResults.map((user, index) => (
                  <UserCard
                    key={user.username}
                    profile={user}
                    index={index + 1}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hashtag Discovery */}
            <section>
              <Link
                to="/hashtags"
                data-ocid="explore.hashtags.link"
                className="flex items-center gap-2 bg-card rounded-2xl border border-border px-4 py-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">#</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Hashtag Discovery</p>
                  <p className="text-xs text-muted-foreground">
                    Browse trending hashtags
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </Link>
            </section>

            {/* Reels horizontal scroll section */}
            {reelPosts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-base font-bold font-display flex items-center gap-1.5">
                    🎬 Reels
                  </h2>
                  <Link
                    to="/reels"
                    data-ocid="explore.reels.link"
                    className="text-xs text-vibe-purple font-semibold"
                  >
                    See all →
                  </Link>
                </div>
                <div
                  className="flex gap-2 overflow-x-auto scrollbar-none pb-1"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {reelPosts.slice(0, 8).map((post) => (
                    <ReelThumbnail key={post.id.toString()} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* Trending Posts */}
            <section>
              <h2 className="text-base font-bold font-display mb-3 px-1 flex items-center gap-1.5">
                🔥 Trending Posts
              </h2>
              {postsLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="aspect-square rounded-xl" />
                  ))}
                </div>
              ) : regularPosts.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="explore.posts.empty_state"
                >
                  <p className="text-sm">No posts yet. Be the first to post!</p>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-2 gap-2"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.05 } },
                    hidden: {},
                  }}
                >
                  {trendingPosts.map((post) => (
                    <motion.div
                      key={post.id.toString()}
                      variants={{
                        hidden: { opacity: 0, scale: 0.95 },
                        visible: { opacity: 1, scale: 1 },
                      }}
                    >
                      <ExplorePostTile post={post} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </section>

            {/* Suggested Users */}
            {suggestedAuthorIds.length > 0 && (
              <section>
                <h2 className="text-base font-bold font-display mb-3 px-1">
                  Suggested Users
                </h2>
                <div
                  className="bg-card rounded-2xl border border-border divide-y divide-border/50 px-3"
                  data-ocid="explore.suggested.list"
                >
                  {suggestedAuthorIds.map((authorIdStr, idx) => {
                    const post = posts.find(
                      (p) =>
                        p.authorId.toString() === authorIdStr &&
                        p.caption !== "__story__",
                    );
                    if (!post) return null;
                    return (
                      <SuggestedUserRowById
                        key={authorIdStr}
                        userId={post.authorId}
                        index={idx + 1}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
