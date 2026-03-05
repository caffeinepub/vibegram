import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { Post, UserId, UserProfile } from "../backend.d";
import {
  useGetCallerUserProfile,
  useGetUserProfile,
} from "../hooks/useQueries";
import { StoryUploadSheet } from "./StoryUploadSheet";
import { StoryViewer } from "./StoryViewer";

interface StoryAvatarProps {
  profile: UserProfile | null | undefined;
  isOwn?: boolean;
  hasStory?: boolean;
  onClick: () => void;
}

function StoryAvatar({ profile, isOwn, hasStory, onClick }: StoryAvatarProps) {
  const photoUrl = profile?.profilePhoto?.getDirectURL();
  const initials = profile
    ? (profile.displayName || profile.username || "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0"
      data-ocid={isOwn ? "stories.add.button" : "stories.item.button"}
    >
      {/* Ring wrapper */}
      <div
        className={cn(
          "w-[58px] h-[58px] rounded-full p-[2.5px]",
          hasStory || isOwn ? "gradient-bg" : "bg-border",
        )}
      >
        <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden relative border-2 border-background">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={profile?.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-semibold font-display text-sm"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
              }}
            >
              {initials}
            </div>
          )}

          {/* "+" icon overlay for own story */}
          {isOwn && (
            <div
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background"
              style={{ background: "oklch(0.62 0.22 295)" }}
            >
              <Plus size={10} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>
      </div>

      {/* Username */}
      <p className="text-[10px] text-muted-foreground font-body leading-none max-w-[58px] truncate text-center">
        {isOwn ? "Your story" : profile?.username || "..."}
      </p>
    </button>
  );
}

// Sub-component to render a story avatar for a given userId
function StoryAvatarById({
  userId,
  onClick,
}: {
  userId: UserId;
  onClick: () => void;
}) {
  const { data: profile } = useGetUserProfile(userId);
  return <StoryAvatar profile={profile} hasStory onClick={onClick} />;
}

interface StoriesBarProps {
  storyPosts: Post[];
}

export function StoriesBar({ storyPosts }: StoriesBarProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  const { data: myProfile } = useGetCallerUserProfile();

  // Group stories by authorId, keeping most recent per author
  const authorStoryMap = useMemo(() => {
    const map = new Map<string, Post>();
    for (const post of storyPosts) {
      const key = post.authorId.toString();
      const existing = map.get(key);
      if (!existing || post.createdAt > existing.createdAt) {
        map.set(key, post);
      }
    }
    return map;
  }, [storyPosts]);

  // Array of unique story posts (one per author)
  const uniqueStories = useMemo(
    () => Array.from(authorStoryMap.values()),
    [authorStoryMap],
  );

  const handleOpenStory = (authorId: UserId) => {
    const idx = uniqueStories.findIndex(
      (s) => s.authorId.toString() === authorId.toString(),
    );
    if (idx >= 0) {
      setViewerStartIndex(idx);
      setViewerOpen(true);
    }
  };

  return (
    <>
      <div
        className="flex items-start gap-3.5 px-4 py-3 overflow-x-auto scrollbar-none border-b border-border"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Add Story tile */}
        <StoryAvatar
          profile={myProfile}
          isOwn
          onClick={() => setUploadOpen(true)}
        />

        {/* Other users' stories */}
        {uniqueStories.map((story) => (
          <StoryAvatarById
            key={story.id.toString()}
            userId={story.authorId}
            onClick={() => handleOpenStory(story.authorId)}
          />
        ))}
      </div>

      {/* Story upload sheet */}
      <StoryUploadSheet open={uploadOpen} onOpenChange={setUploadOpen} />

      {/* Story viewer */}
      <StoryViewer
        stories={uniqueStories}
        startIndex={viewerStartIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
