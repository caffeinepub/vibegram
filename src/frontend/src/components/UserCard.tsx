import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { UserId, UserProfile } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useFollowUser, useUnfollowUser } from "../hooks/useQueries";
import { AvatarWithRing } from "./AvatarWithRing";

interface UserCardProps {
  profile: UserProfile & { userId?: UserId };
  followers?: UserId[];
  index: number;
  onUserClick?: () => void;
}

export function UserCard({
  profile,
  followers = [],
  index,
  onUserClick,
}: UserCardProps) {
  const { identity } = useInternetIdentity();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const currentPrincipal = identity?.getPrincipal().toString();
  const isOwn = profile.userId?.toString() === currentPrincipal;
  const isFollowing = profile.userId
    ? followers.some((id) => id.toString() === currentPrincipal)
    : false;

  // Note: "isFollowing" here means the current user is in the followers list
  // We need to check if current user follows this person
  // (followers = people who follow this user; isFollowing means current user is among them)
  const [optimisticFollow, setOptimisticFollow] = useState<boolean | null>(
    null,
  );

  const following = optimisticFollow !== null ? optimisticFollow : isFollowing;

  const handleFollow = async () => {
    if (!profile.userId) return;
    if (following) {
      setOptimisticFollow(false);
      await unfollowUser.mutateAsync(profile.userId);
    } else {
      setOptimisticFollow(true);
      await followUser.mutateAsync(profile.userId);
    }
    setOptimisticFollow(null);
  };

  const isPending = followUser.isPending || unfollowUser.isPending;

  return (
    <div
      className="flex items-center justify-between py-3 px-1"
      data-ocid={`explore.user.item.${index}`}
    >
      <button
        type="button"
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
        onClick={onUserClick}
      >
        <AvatarWithRing profile={profile} size="md" showRing />
        <div className="min-w-0">
          <p className="text-sm font-semibold font-display truncate">
            {profile.displayName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            @{profile.username}
          </p>
        </div>
      </button>

      {!isOwn && (
        <Button
          size="sm"
          data-ocid="profile.follow.button"
          onClick={handleFollow}
          disabled={isPending}
          className={cn(
            "shrink-0 text-xs font-semibold h-8 px-4 rounded-full transition-all",
            following
              ? "bg-secondary text-foreground border border-border hover:bg-muted"
              : "btn-gradient text-white border-0",
          )}
        >
          {isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : following ? (
            "Following"
          ) : (
            "Follow"
          )}
        </Button>
      )}
    </div>
  );
}
