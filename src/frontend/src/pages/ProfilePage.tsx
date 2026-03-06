import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import {
  Bell,
  Bookmark,
  Clapperboard,
  Grid3x3,
  Loader2,
  Settings,
  Tag,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Post } from "../backend.d";
import { AvatarWithRing } from "../components/AvatarWithRing";
import { PostDetailModal } from "../components/PostDetailModal";
import { VerificationBadge } from "../components/VerificationBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useFollowers,
  useFollowing,
  useGetCallerUserProfile,
  useGetPost,
  useUpdateProfile,
  useUserPosts,
} from "../hooks/useQueries";
import { formatCount } from "../utils/helpers";

const SAVED_POSTS_KEY = "vg_saved_posts";

function getSavedPostIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_POSTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function PostGridTile({
  post,
  onPostClick,
}: { post: Post; onPostClick?: (post: Post) => void }) {
  const mediaUrl = post.media?.getDirectURL();
  return (
    <button
      type="button"
      className="aspect-square rounded-xl overflow-hidden bg-secondary relative group w-full"
      onClick={() => onPostClick?.(post)}
      aria-label="View post"
    >
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
                <Play size={12} className="text-white fill-white" />
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
    </button>
  );
}

function SavedPostTile({ postId }: { postId: string }) {
  const { data: post, isLoading } = useGetPost(BigInt(postId));

  if (isLoading) return <Skeleton className="aspect-square rounded-xl" />;
  if (!post)
    return <div className="aspect-square rounded-xl bg-secondary opacity-40" />;

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

function EditProfileModal({
  open,
  onOpenChange,
  currentDisplayName,
  currentBio,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentDisplayName: string;
  currentBio: string;
}) {
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [bio, setBio] = useState(currentBio);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const updateProfile = useUpdateProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let profilePhoto: ExternalBlob | null = null;
      if (photoFile) {
        const bytes = new Uint8Array(await photoFile.arrayBuffer());
        profilePhoto = ExternalBlob.fromBytes(bytes);
      }
      await updateProfile.mutateAsync({ displayName, bio, profilePhoto });
      toast.success("Profile updated!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm bg-card border-border rounded-2xl"
        data-ocid="profile.edit.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-secondary border-border"
              placeholder="Your name"
              data-ocid="profile.edit.name.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-secondary border-border resize-none"
              placeholder="Tell everyone who you are..."
              rows={3}
              maxLength={150}
              data-ocid="profile.edit.bio.textarea"
            />
            <p className="text-right text-xs text-muted-foreground">
              {bio.length}/150
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Profile Photo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="bg-secondary border-border text-sm"
              data-ocid="profile.photo.upload_button"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-ocid="profile.edit.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex-1 btn-gradient border-0"
              data-ocid="profile.edit.save_button"
            >
              {updateProfile.isPending ? (
                <Loader2 size={16} className="animate-spin mr-1" />
              ) : null}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProfilePage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const principalStr = identity?.getPrincipal();
  const { data: posts = [], isLoading: postsLoading } = useUserPosts(
    principalStr || null,
  );
  const { data: followers = [] } = useFollowers(principalStr || null);
  const { data: following = [] } = useFollowing(principalStr || null);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setPostModalOpen(true);
  };

  // Verification: check localStorage or known usernames
  const isVerified =
    profile?.username === "vibegram" ||
    (principalStr
      ? !!localStorage.getItem(`vg_verified_${principalStr.toString()}`)
      : false);

  const savedIds = getSavedPostIds();

  if (profileLoading) {
    return (
      <div
        className="flex flex-col min-h-screen pb-safe"
        data-ocid="profile.loading_state"
      >
        <div className="px-4 py-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayPosts = posts.filter(
    (p) => p.caption !== "__story__" && !p.caption.startsWith("__reel__"),
  );
  const reelPosts = posts.filter(
    (p) =>
      p.caption.startsWith("__reel__") ||
      (p.mediaType === "video" && p.caption !== "__story__"),
  );

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3 border-b border-border flex items-center justify-between"
        style={{
          background: "oklch(0.14 0.008 260 / 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <h1 className="text-xl font-bold font-display">
          {profile?.username ? `@${profile.username}` : "Profile"}
        </h1>

        <div className="flex items-center gap-1">
          {/* Notifications bell */}
          <Link
            to="/notifications"
            data-ocid="profile.notifications.link"
            className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </Link>

          {/* Settings */}
          <Link
            to="/settings"
            data-ocid="profile.settings.link"
            className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </Link>
        </div>
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
                  {profile?.displayName || "New User"}
                </h2>
                {isVerified && <VerificationBadge size="md" />}
              </div>
              <p className="text-sm text-muted-foreground">
                @{profile?.username}
              </p>

              {/* Stats */}
              <div className="flex gap-5 pt-2">
                <div className="text-center">
                  <p className="text-base font-bold font-display">
                    {formatCount(displayPosts.length)}
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

          {/* Edit profile button */}
          <Button
            data-ocid="profile.edit.button"
            onClick={() => setEditOpen(true)}
            variant="outline"
            className="w-full border-border hover:bg-secondary font-semibold h-9 text-sm"
          >
            Edit Profile
          </Button>
        </motion.div>

        {/* Tabs */}
        <div className="border-t border-border">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full bg-transparent border-b border-border rounded-none h-auto p-0">
              <TabsTrigger
                value="posts"
                data-ocid="profile.posts.tab"
                className="flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-vibe-purple data-[state=active]:text-vibe-purple data-[state=active]:bg-transparent"
              >
                <Grid3x3 size={18} />
              </TabsTrigger>
              <TabsTrigger
                value="reels"
                data-ocid="profile.reels.tab"
                className="flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-vibe-purple data-[state=active]:text-vibe-purple data-[state=active]:bg-transparent"
              >
                <Clapperboard size={18} />
              </TabsTrigger>
              <TabsTrigger
                value="tagged"
                data-ocid="profile.tagged.tab"
                className="flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-vibe-purple data-[state=active]:text-vibe-purple data-[state=active]:bg-transparent"
              >
                <Tag size={18} />
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                data-ocid="profile.saved.tab"
                className="flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-vibe-purple data-[state=active]:text-vibe-purple data-[state=active]:bg-transparent"
              >
                <Bookmark size={18} />
              </TabsTrigger>
            </TabsList>

            {/* Posts tab */}
            <TabsContent value="posts" className="mt-0">
              {postsLoading ? (
                <div className="grid grid-cols-3 gap-0.5 px-0.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="aspect-square" />
                  ))}
                </div>
              ) : displayPosts.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center px-6"
                  data-ocid="profile.posts.empty_state"
                >
                  <div className="gradient-bg rounded-2xl p-4 mb-4 opacity-80">
                    <Grid3x3 size={28} className="text-white" />
                  </div>
                  <p className="font-semibold text-sm">No posts yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share your first vibe!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-0.5 px-0.5">
                  {displayPosts.map((post) => (
                    <PostGridTile
                      key={post.id.toString()}
                      post={post}
                      onPostClick={handlePostClick}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reels tab */}
            <TabsContent value="reels" className="mt-0">
              {reelPosts.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center px-6"
                  data-ocid="profile.reels.empty_state"
                >
                  <div
                    className="rounded-2xl p-4 mb-4"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.6 0.2 225), oklch(0.62 0.22 295))",
                    }}
                  >
                    <Clapperboard size={28} className="text-white" />
                  </div>
                  <p className="font-semibold text-sm">No reels yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share your first reel!
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/reels" })}
                    className="mt-3 text-xs text-vibe-purple font-semibold"
                  >
                    Browse Reels →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-0.5 px-0.5">
                  {reelPosts.map((post) => (
                    <PostGridTile
                      key={post.id.toString()}
                      post={post}
                      onPostClick={() => navigate({ to: "/reels" })}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tagged tab */}
            <TabsContent value="tagged" className="mt-0">
              <div
                className="flex flex-col items-center justify-center py-16 text-center px-6"
                data-ocid="profile.tagged.empty_state"
              >
                <div className="border-2 border-dashed border-border rounded-2xl p-6 mb-4">
                  <Tag size={28} className="text-muted-foreground" />
                </div>
                <p className="font-semibold text-sm">No tagged posts</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Posts you're tagged in will appear here
                </p>
              </div>
            </TabsContent>

            {/* Saved tab */}
            <TabsContent value="saved" className="mt-0">
              {savedIds.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center px-6"
                  data-ocid="profile.saved.empty_state"
                >
                  <div className="gradient-bg rounded-2xl p-4 mb-4 opacity-80">
                    <Bookmark size={28} className="text-white" />
                  </div>
                  <p className="font-semibold text-sm">No saved posts</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tap the bookmark icon on any post to save it
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-0.5 px-0.5">
                  {savedIds.map((postId, idx) => (
                    <div
                      key={postId}
                      data-ocid={`profile.saved.item.${idx + 1}`}
                    >
                      <SavedPostTile postId={postId} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <EditProfileModal
        open={editOpen}
        onOpenChange={setEditOpen}
        currentDisplayName={profile?.displayName || ""}
        currentBio={profile?.bio || ""}
      />

      <PostDetailModal
        post={selectedPost}
        open={postModalOpen}
        onOpenChange={setPostModalOpen}
      />
    </div>
  );
}
