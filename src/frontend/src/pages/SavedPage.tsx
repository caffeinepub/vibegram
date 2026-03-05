import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bookmark } from "lucide-react";
import { useGetPost } from "../hooks/useQueries";

const SAVED_POSTS_KEY = "vg_saved_posts";

function getSavedPostIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_POSTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function SavedPostTile({ postId }: { postId: string }) {
  const { data: post, isLoading } = useGetPost(BigInt(postId));

  if (isLoading) {
    return <Skeleton className="aspect-square rounded-xl" />;
  }

  if (!post) {
    return <div className="aspect-square rounded-xl bg-secondary opacity-40" />;
  }

  const mediaUrl = post.media?.getDirectURL();

  return (
    <div className="aspect-square rounded-xl overflow-hidden bg-secondary relative group">
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

export function SavedPage() {
  const navigate = useNavigate();
  const savedIds = getSavedPostIds();

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
          onClick={() => navigate({ to: "/profile" })}
          className="text-muted-foreground hover:text-foreground p-1 rounded-xl hover:bg-secondary transition-colors"
          aria-label="Back"
          data-ocid="saved.back.button"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold font-display flex items-center gap-2">
          <Bookmark size={18} className="text-vibe-purple" />
          Saved Posts
        </h1>
      </header>

      <main className="flex-1 px-3 py-4">
        {savedIds.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center px-6"
            data-ocid="saved.empty_state"
          >
            <div
              className="rounded-3xl p-6 mb-5 shadow-glow"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
              }}
            >
              <Bookmark size={32} className="text-white" />
            </div>
            <h3 className="text-lg font-bold font-display mb-2">
              No saved posts yet
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
              Tap the bookmark icon on any post to save it here
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground px-1 mb-3">
              {savedIds.length} saved {savedIds.length === 1 ? "post" : "posts"}
            </p>
            <div
              className="grid grid-cols-3 gap-0.5"
              data-ocid="saved.posts.list"
            >
              {savedIds.map((postId, idx) => (
                <div key={postId} data-ocid={`saved.post.item.${idx + 1}`}>
                  <SavedPostTile postId={postId} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
