import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, RefreshCw, Send } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Post } from "../backend.d";
import { PostCard, PostCardSkeleton } from "../components/PostCard";
import { PostDetailModal } from "../components/PostDetailModal";
import { StoriesBar } from "../components/StoriesBar";
import {
  useExploreFeed,
  useHomeFeed,
  useNotifications,
} from "../hooks/useQueries";

export function HomePage() {
  const { data: posts = [], isLoading, isError } = useHomeFeed();
  const { data: explorePosts = [] } = useExploreFeed();
  const { data: notifications = [] } = useNotifications();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
    queryClient.invalidateQueries({ queryKey: ["exploreFeed"] });
  };

  const handleCommentClick = (post: Post) => {
    setSelectedPost(post);
    setModalOpen(true);
  };

  // Stories: filter explore posts with caption '__story__'
  const storyPosts = useMemo(
    () => explorePosts.filter((p) => p.caption === "__story__"),
    [explorePosts],
  );

  // Non-story posts for the feed
  const feedPosts = useMemo(
    () => posts.filter((p) => p.caption !== "__story__"),
    [posts],
  );

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b border-border"
        style={{
          background: "oklch(0.14 0.008 260 / 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <h1 className="text-2xl font-bold font-display gradient-text">
          VibeGram
        </h1>
        <div className="flex items-center gap-1">
          {/* Messages */}
          <Link
            to="/messages"
            data-ocid="home.messages.link"
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-secondary"
            aria-label="Messages"
          >
            <Send size={18} />
          </Link>

          {/* Notifications */}
          <Link
            to="/notifications"
            data-ocid="home.notifications.link"
            className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-secondary"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[9px] gradient-bg border-0 text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Link>

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-secondary"
            aria-label="Refresh feed"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Stories Bar */}
      <StoriesBar storyPosts={storyPosts} />

      {/* Feed */}
      <main className="flex-1 px-3 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4" data-ocid="feed.loading_state">
            {[1, 2, 3].map((i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center px-6"
            data-ocid="feed.error_state"
          >
            <p className="text-lg font-semibold text-destructive">
              Failed to load feed
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Pull down to refresh
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 rounded-full bg-secondary text-sm font-medium hover:bg-muted transition-colors"
            >
              Try again
            </button>
          </div>
        ) : feedPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center px-6"
            data-ocid="feed.empty_state"
          >
            <div className="gradient-bg rounded-3xl p-6 mb-6 shadow-glow">
              <span className="text-4xl">📸</span>
            </div>
            <h3 className="text-xl font-bold font-display mb-2">
              Your feed is empty
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Follow some users on the Explore page to see their posts here
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {feedPosts.map((post, index) => (
              <PostCard
                key={post.id.toString()}
                post={post}
                index={index + 1}
                onCommentClick={handleCommentClick}
                onPostClick={handleCommentClick}
              />
            ))}
          </div>
        )}
      </main>

      <PostDetailModal
        post={selectedPost}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
