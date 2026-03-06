import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Music2,
  Tag,
  Users,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, MediaType } from "../backend";
import { CreativeToolbar } from "../components/CreativeToolbar";
import {
  MediaOverlayCanvas,
  type Overlay,
} from "../components/MediaOverlayCanvas";
import { useCreatePost } from "../hooks/useQueries";

interface UploadPageProps {
  onSuccess?: () => void;
}

export function UploadPage({ onSuccess }: UploadPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [collabUser, setCollabUser] = useState("");
  const [tagPeople, setTagPeople] = useState("");
  const [locationTag, setLocationTag] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [filterStyle, setFilterStyle] = useState("");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedSong, setSelectedSong] = useState<{
    title: string;
    artist: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Only images and videos are supported");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be under 50MB");
      return;
    }
    setSelectedFile(file);
    setUploadDone(false);
    setUploadProgress(0);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClear = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCaption("");
    setCollabUser("");
    setTagPeople("");
    setLocationTag("");
    setUploadProgress(0);
    setUploadDone(false);
    setFilterStyle("");
    setOverlays([]);
    setSelectedSong(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
        (percentage) => setUploadProgress(percentage),
      );

      const mediaType = selectedFile.type.startsWith("video/")
        ? MediaType.video
        : MediaType.photo;

      let finalCaption = caption.trim();
      if (collabUser.trim()) {
        const cu = collabUser.trim().startsWith("@")
          ? collabUser.trim()
          : `@${collabUser.trim()}`;
        finalCaption = `__collab__${cu}__${finalCaption}`;
      }
      if (locationTag.trim()) {
        finalCaption += `__loc__${locationTag.trim()}__`;
      }
      if (tagPeople.trim()) {
        const tags = tagPeople
          .split(",")
          .map((t) => {
            const trimmed = t.trim();
            return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
          })
          .filter(Boolean)
          .join(",");
        if (tags) finalCaption += `__tags__${tags}__`;
      }

      await createPost.mutateAsync({
        media: blob,
        mediaType,
        caption: finalCaption,
      });

      setUploadDone(true);
      toast.success("Post published! 🎉");
      setTimeout(() => {
        handleClear();
        onSuccess?.();
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || "Upload failed. Please try again.");
      setUploadProgress(0);
    }
  };

  const isVideo = selectedFile?.type.startsWith("video/");
  const isUploading = createPost.isPending;

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
        <h1 className="text-xl font-bold font-display">New Post</h1>
        {selectedFile && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X size={20} />
          </button>
        )}
      </header>

      <main className="flex-1 px-4 py-6 space-y-5">
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            /* Dropzone */
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <label
                htmlFor="file-upload"
                data-ocid="upload.dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all py-16 px-8 text-center",
                  isDragging
                    ? "border-vibe-purple bg-vibe-purple/10"
                    : "border-border hover:border-vibe-purple/60 hover:bg-secondary/50",
                )}
              >
                <div className="gradient-bg rounded-2xl p-5 mb-5">
                  <ImagePlus size={32} className="text-white" />
                </div>
                <h3 className="text-lg font-bold font-display mb-2">
                  Share your vibe
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Drop a photo or video here, or tap to browse
                </p>
                <div className="flex gap-3 mt-5">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                    <ImagePlus size={12} /> Photos
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                    <Video size={12} /> Videos
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-4 opacity-60">
                  Max 50MB
                </p>
              </label>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleInputChange}
                className="hidden"
                data-ocid="upload.button"
              />
            </motion.div>
          ) : (
            /* Preview + form */
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Media preview */}
              <div className="relative rounded-2xl overflow-hidden bg-secondary aspect-square">
                <MediaOverlayCanvas
                  overlays={overlays}
                  onRemoveOverlay={(id) =>
                    setOverlays((prev) => prev.filter((o) => o.id !== id))
                  }
                  filterStyle={filterStyle}
                  className="w-full h-full"
                >
                  {isVideo ? (
                    // biome-ignore lint/a11y/useMediaCaption: user-generated content preview
                    <video
                      src={preview!}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={preview!}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </MediaOverlayCanvas>

                {/* Media type badge */}
                <div className="absolute top-3 left-3 pointer-events-none">
                  <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                    {isVideo ? (
                      <>
                        <Video size={10} /> Video
                      </>
                    ) : (
                      <>
                        <ImagePlus size={10} /> Photo
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Creative Toolbar */}
              <CreativeToolbar
                onFilterSelect={setFilterStyle}
                onStickerAdd={(emoji) =>
                  setOverlays((prev) => [
                    ...prev,
                    {
                      id: `sticker-${Date.now()}-${Math.random()}`,
                      type: "sticker",
                      content: emoji,
                      x: 40,
                      y: 40,
                    },
                  ])
                }
                onTextAdd={(overlay) =>
                  setOverlays((prev) => [
                    ...prev,
                    {
                      id: `text-${Date.now()}-${Math.random()}`,
                      type: "text",
                      content: overlay.text,
                      style: overlay.style,
                      color: overlay.color,
                      x: 40,
                      y: 40,
                    },
                  ])
                }
                onMusicSelect={setSelectedSong}
                selectedFilter={filterStyle}
                selectedSong={selectedSong}
              />

              {/* Music bar */}
              {selectedSong && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-primary/40"
                  style={{ background: "oklch(0.62 0.22 295 / 0.1)" }}
                >
                  <Music2
                    size={15}
                    style={{ color: "oklch(0.75 0.22 295)" }}
                    className="shrink-0"
                  />
                  <span className="flex-1 text-xs font-medium text-foreground truncate">
                    {selectedSong.title} — {selectedSong.artist}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSong(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Remove song"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}

              {/* Caption */}
              <div>
                <Textarea
                  data-ocid="upload.caption.textarea"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption... ✨"
                  className="bg-secondary border-border resize-none text-sm"
                  rows={3}
                  maxLength={2200}
                />
                <p className="text-right text-xs text-muted-foreground mt-1">
                  {caption.length}/2200
                </p>
              </div>

              {/* Collaborate with */}
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <Users size={13} className="text-muted-foreground" />{" "}
                  Collaborate with
                </Label>
                <Input
                  value={collabUser}
                  onChange={(e) => setCollabUser(e.target.value)}
                  placeholder="@username"
                  className="bg-secondary border-border text-sm"
                  data-ocid="upload.collab.input"
                />
              </div>

              {/* Tag people */}
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <Tag size={13} className="text-muted-foreground" /> Tag People
                </Label>
                <Input
                  value={tagPeople}
                  onChange={(e) => setTagPeople(e.target.value)}
                  placeholder="@user1, @user2"
                  className="bg-secondary border-border text-sm"
                  data-ocid="upload.tags.input"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <MapPin size={13} className="text-muted-foreground" />{" "}
                  Location
                </Label>
                <Input
                  value={locationTag}
                  onChange={(e) => setLocationTag(e.target.value)}
                  placeholder="Add location..."
                  className="bg-secondary border-border text-sm"
                  data-ocid="upload.location.input"
                />
              </div>

              {/* Upload progress */}
              {isUploading && uploadProgress > 0 && (
                <div className="space-y-2" data-ocid="upload.loading_state">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Success indicator */}
              <AnimatePresence>
                {uploadDone && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 py-3 text-emerald-400"
                    data-ocid="upload.success_state"
                  >
                    <CheckCircle2 size={20} />
                    <span className="text-sm font-semibold">Published!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <Button
                data-ocid="upload.submit_button"
                onClick={handleSubmit}
                disabled={isUploading || uploadDone}
                className="w-full btn-gradient border-0 font-semibold h-12 text-base"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  "Share Post ✨"
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
