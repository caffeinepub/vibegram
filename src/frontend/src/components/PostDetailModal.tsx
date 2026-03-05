import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import type { Comment, Post } from "../backend.d";
import {
  useCreateComment,
  useGetUserProfile,
  usePostComments,
} from "../hooks/useQueries";
import { formatRelativeTime } from "../utils/helpers";
import { AvatarWithRing } from "./AvatarWithRing";

interface PostDetailModalProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CommentItem({ comment }: { comment: Comment }) {
  const { data: author } = useGetUserProfile(comment.authorId);
  return (
    <div className="flex gap-3 py-3">
      <AvatarWithRing profile={author} size="xs" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold font-display">
            {author?.username || "..."}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">
          {comment.text}
        </p>
      </div>
    </div>
  );
}

export function PostDetailModal({
  post,
  open,
  onOpenChange,
}: PostDetailModalProps) {
  const [commentText, setCommentText] = useState("");
  const { data: comments = [], isLoading } = usePostComments(
    open ? (post?.id ?? null) : null,
  );
  const { data: author } = useGetUserProfile(post?.authorId ?? null);
  const createComment = useCreateComment();

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return;
    await createComment.mutateAsync({ postId: post.id, text: commentText });
    setCommentText("");
  };

  const mediaUrl = post?.media?.getDirectURL();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[430px] p-0 overflow-hidden bg-card border-border rounded-2xl"
        data-ocid="post.dialog"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Post details</DialogTitle>
        </DialogHeader>

        {/* Media */}
        {mediaUrl && (
          <div className="aspect-square w-full bg-secondary overflow-hidden">
            {post?.mediaType === "video" ? (
              // biome-ignore lint/a11y/useMediaCaption: user-generated content
              <video
                src={mediaUrl}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            ) : (
              <img
                src={mediaUrl}
                alt={post?.caption}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Author + Caption */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <AvatarWithRing profile={author} size="sm" showRing />
            <div>
              <p className="text-sm font-semibold font-display">
                {author?.displayName || author?.username}
              </p>
              {post?.caption && (
                <p className="text-sm text-foreground/80 mt-0.5 line-clamp-2">
                  {post.caption}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        <ScrollArea className="h-64 px-4">
          {isLoading ? (
            <div className="space-y-3 py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 py-2">
                  <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 text-muted-foreground"
              data-ocid="comments.empty_state"
            >
              <MessageCircleIcon />
              <p className="text-sm mt-2">No comments yet</p>
              <p className="text-xs">Be the first to comment!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {comments.map((comment, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: comments don't have stable keys
                <CommentItem key={i} comment={comment} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Comment input */}
        <div className="px-4 py-3 border-t border-border flex gap-2">
          <Input
            data-ocid="comment.input"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-secondary border-border text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />
          <Button
            size="icon"
            data-ocid="comment.submit_button"
            onClick={handleSubmitComment}
            disabled={!commentText.trim() || createComment.isPending}
            className="btn-gradient shrink-0"
          >
            {createComment.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MessageCircleIcon() {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
