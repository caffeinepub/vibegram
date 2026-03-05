import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Hash, Play, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Post } from "../backend.d";
import { useExploreFeed } from "../hooks/useQueries";

// ─── Post thumbnail (reuse pattern from ExplorePage) ─────────────────────────

function HashtagPostTile({ post }: { post: Post }) {
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
              <div className="bg-black/50 rounded-full p-2">
                <Play size={14} className="text-white fill-white" />
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

// ─── Hashtag pill ─────────────────────────────────────────────────────────────

interface HashtagPillProps {
  tag: string;
  count: number;
  rank: number;
  index: number;
  onClick: () => void;
}

function HashtagPill({ tag, count, rank, index, onClick }: HashtagPillProps) {
  const isTrending = rank < 3;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-ocid={index <= 3 ? `hashtags.tag.item.${index}` : undefined}
      className="flex items-center justify-between gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 hover:bg-secondary/50 active:scale-[0.98] transition-all text-left w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center shrink-0">
          <Hash size={16} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">
            {isTrending && <span className="mr-1">🔥</span>}
            <span className="bg-gradient-to-r from-vibe-purple to-vibe-pink bg-clip-text text-transparent">
              #{tag}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {count} {count === 1 ? "post" : "posts"}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
        {count}
      </span>
    </motion.button>
  );
}

// ─── Loading skeletons ────────────────────────────────────────────────────────

function HashtagSkeletons() {
  return (
    <div className="space-y-2.5" data-ocid="hashtags.loading_state">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5"
        >
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── HashtagsPage ─────────────────────────────────────────────────────────────

export function HashtagsPage() {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { data: posts = [], isLoading } = useExploreFeed();

  // Parse hashtags from real post captions only
  const hashtagMap = useMemo(() => {
    const map = new Map<string, Post[]>();

    for (const post of posts) {
      // Skip system captions
      if (
        post.caption === "__story__" ||
        post.caption.startsWith("__cf__") ||
        post.caption.startsWith("__reel__")
      ) {
        continue;
      }

      const matches = post.caption.matchAll(/#(\w+)/g);
      for (const match of matches) {
        const tag = match[1].toLowerCase();
        if (!map.has(tag)) map.set(tag, []);
        map.get(tag)!.push(post);
      }
    }

    return map;
  }, [posts]);

  // Sorted list of [tag, posts[]] by count desc
  const sortedTags = useMemo(() => {
    return Array.from(hashtagMap.entries()).sort(
      (a, b) => b[1].length - a[1].length,
    );
  }, [hashtagMap]);

  // Filtered by search query
  const filteredTags = useMemo(() => {
    if (!query.trim()) return sortedTags;
    const q = query.trim().toLowerCase().replace(/^#/, "");
    return sortedTags.filter(([tag]) => tag.includes(q));
  }, [sortedTags, query]);

  const selectedPosts = selectedTag ? (hashtagMap.get(selectedTag) ?? []) : [];

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
        <div className="flex items-center gap-3 mb-3">
          {selectedTag ? (
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className="p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
              aria-label="Back"
              data-ocid="hashtags.back.button"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <Link
              to="/explore"
              className="p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
              aria-label="Back to Explore"
            >
              <ArrowLeft size={20} />
            </Link>
          )}

          <div>
            <h1 className="text-xl font-bold font-display leading-tight">
              {selectedTag ? (
                <span className="bg-gradient-to-r from-vibe-purple to-vibe-pink bg-clip-text text-transparent">
                  #{selectedTag}
                </span>
              ) : (
                "Hashtag Discovery"
              )}
            </h1>
            {selectedTag && (
              <p className="text-xs text-muted-foreground">
                {selectedPosts.length}{" "}
                {selectedPosts.length === 1 ? "post" : "posts"}
              </p>
            )}
          </div>
        </div>

        {/* Search input — only shown on list view */}
        {!selectedTag && (
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              data-ocid="hashtags.search.input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hashtags..."
              className="pl-9 pr-4 bg-secondary border-border"
            />
          </div>
        )}
      </header>

      <main className="flex-1 px-3 py-4">
        <AnimatePresence mode="wait">
          {/* ── Detail view for a selected hashtag ── */}
          {selectedTag ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
            >
              {selectedPosts.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-20 text-center"
                  data-ocid="hashtags.posts.empty_state"
                >
                  <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mb-4 opacity-70">
                    <Hash size={28} className="text-white" />
                  </div>
                  <p className="font-semibold text-base">No posts yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Be the first to post with #{selectedTag}
                  </p>
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
                  {selectedPosts.map((post) => (
                    <motion.div
                      key={post.id.toString()}
                      variants={{
                        hidden: { opacity: 0, scale: 0.95 },
                        visible: { opacity: 1, scale: 1 },
                      }}
                    >
                      <HashtagPostTile post={post} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* ── Hashtag list view ── */
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.22 }}
            >
              {isLoading ? (
                <HashtagSkeletons />
              ) : filteredTags.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-20 text-center"
                  data-ocid="hashtags.empty_state"
                >
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-muted-foreground/50 font-display">
                      #
                    </span>
                  </div>
                  <p className="font-semibold text-base">
                    {query ? "No hashtags found" : "No hashtags yet"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {query
                      ? "Try a different search term"
                      : "Posts with #hashtags will appear here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTags.map(([tag, tagPosts], idx) => (
                    <HashtagPill
                      key={tag}
                      tag={tag}
                      count={tagPosts.length}
                      rank={idx}
                      index={idx + 1}
                      onClick={() => setSelectedTag(tag)}
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
