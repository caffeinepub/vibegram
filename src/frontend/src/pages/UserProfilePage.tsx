import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Principal } from "@dfinity/principal";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Grid3x3, MessageCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Post } from "../backend.d";
import { AvatarWithRing } from "../components/AvatarWithRing";
import { VerificationBadge } from "../components/VerificationBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useFollowUser,
  useFollowers,
  useFollowing,
  useGetUserProfile,
  useUnfollowUser,
  useUserPosts,
} from "../hooks/useQueries";
import { formatCount } from "../utils/helpers";

function PostGridTile({ post }: { post: Post }) {
  const mediaUrl = post.media?.getDirectURL();
  return (
    <div className="aspect-square rounded-none overflow-hidden bg-secondary relative group">
      {mediaUrl ? (
        post.mediaType === "video" ? (
          <div className="relative w-full h-full">
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/40 rounded-full p-2">
                {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative play icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
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
        <div className="w-full h-full gradient-bg opacity-30" />
      )}
    </div>
  );
}

export function UserProfilePage() {
  const params = useParams({ strict: false }) as { userId?: string };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const userId = params.userId
    ? (() => {
        try {
          return Principal.fromText(params.userId);
        } catch {
          return null;
        }
      })()
    : null;

  const { data: profile, isLoading: profileLoading } =
    useGetUserProfile(userId);
  const { data: posts = [], isLoading: postsLoading } = useUserPosts(userId);
  const { data: followers = [] } = useFollowers(userId);
  const { data: following = [] } = useFollowing(userId);

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const currentPrincipal = identity?.getPrincipal().toString();
  const isOwn = userId?.toString() === currentPrincipal;

  const isFollowing = identity
    ? followers.some((id) => id.toString() === currentPrincipal)
    : false;

  const [optimisticFollow, setOptimisticFollow] = useState<boolean | null>(
    null,
  );
  const effectiveFollow =
    optimisticFollow !== null ? optimisticFollow : isFollowing;

  const handleFollow = async () => {
    if (!userId) return;
    if (effectiveFollow) {
      setOptimisticFollow(false);
      await unfollowUser.mutateAsync(userId);
    } else {
      setOptimisticFollow(true);
      await followUser.mutateAsync(userId);
    }
    setOptimisticFollow(null);
  };

  const handleMessage = () => {
    if (userId) {
      navigate({ to: "/messages", search: { userId: userId.toString() } });
    }
  };

  const isPending = followUser.isPending || unfollowUser.isPending;

  if (profileLoading) {
    return (
      <div
        className="flex flex-col min-h-screen pb-safe"
        data-ocid="user.profile.loading_state"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="px-5 py-6 space-y-4">
          <div className="flex items-center gap-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3 border-b border-border flex items-center gap-3"
        style={{
          background: "oklch(0.14 0.008 260 / 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-display">
          {profile?.username ? `@${profile.username}` : "Profile"}
        </h1>
      </header>

      <main className="flex-1">
        {/* Profile info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 py-6 space-y-4"
        >
          <div className="flex items-start gap-5">
            <AvatarWithRing profile={profile} size="xl" showRing />

            <div className="flex-1 space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold font-display leading-tight">
                  {profile?.displayName || "Unknown User"}
                </h2>
                {profile?.username === "vibegram" && (
                  <VerificationBadge size="md" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                @{profile?.username}
              </p>

              {/* Stats */}
              <div className="flex gap-5 pt-1">
                <div className="text-center">
                  <p className="text-base font-bold font-display">
                    {formatCount(posts.length)}
                  </p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold font-display">
                    {formatCount(followers.length)}
                  </p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold font-display">
                    {formatCount(following.length)}
                  </p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className="text-sm text-foreground/90 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Actions */}
          {!isOwn && (
            <div className="flex gap-3">
              <Button
                data-ocid="profile.follow.button"
                onClick={handleFollow}
                disabled={isPending}
                className={cn(
                  "flex-1 h-9 text-sm font-semibold rounded-xl",
                  effectiveFollow
                    ? "bg-secondary text-foreground border border-border hover:bg-muted"
                    : "btn-gradient border-0 text-white",
                )}
              >
                {isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : null}
                {effectiveFollow ? "Following" : "Follow"}
              </Button>
              <Button
                variant="outline"
                onClick={handleMessage}
                className="flex-1 h-9 text-sm font-semibold rounded-xl border-border"
              >
                <MessageCircle size={14} className="mr-1.5" />
                Message
              </Button>
            </div>
          )}
        </motion.div>

        {/* Posts grid */}
        <div className="border-t border-border pt-1">
          <div className="flex items-center justify-center py-2">
            <Grid3x3 size={18} className="text-muted-foreground" />
          </div>

          {postsLoading ? (
            <div className="grid grid-cols-3 gap-0.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center px-6"
              data-ocid="user.posts.empty_state"
            >
              <p className="font-semibold text-sm">No posts yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                This user hasn't posted yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {posts.map((post) => (
                <PostGridTile key={post.id.toString()} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
