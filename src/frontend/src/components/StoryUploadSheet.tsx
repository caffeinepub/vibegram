import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, ImagePlus, Loader2, Video, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, MediaType } from "../backend";
import { useCreatePost } from "../hooks/useQueries";

interface StoryUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoryUploadSheet({
  open,
  onOpenChange,
}: StoryUploadSheetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [isCloseFriendsOnly, setIsCloseFriendsOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  const handleFileSelect = useCallback(
    (file: File) => {
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
      if (preview) URL.revokeObjectURL(preview);
      const url = URL.createObjectURL(file);
      setPreview(url);
    },
    [preview],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setUploadProgress(0);
    setUploadDone(false);
    setIsCloseFriendsOnly(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleClear();
    onOpenChange(false);
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

      // Stories use caption '__story__' or '__cf__' (close friends only) as sentinel
      await createPost.mutateAsync({
        media: blob,
        mediaType,
        caption: isCloseFriendsOnly ? "__cf__" : "__story__",
      });

      setUploadDone(true);
      toast.success("Story shared! 🌟");
      setTimeout(() => {
        handleClose();
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
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="h-[85dvh] rounded-t-3xl bg-background border-border p-0 overflow-hidden"
        data-ocid="story.upload.sheet"
      >
        <SheetHeader className="px-5 py-4 border-b border-border flex-row items-center justify-between space-y-0">
          <SheetTitle className="font-display text-lg">Add Story</SheetTitle>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
            aria-label="Close"
            data-ocid="story.upload.close_button"
          >
            <X size={20} />
          </button>
        </SheetHeader>

        <div className="flex-1 px-5 py-6 space-y-5 overflow-y-auto scrollbar-none h-full pb-24">
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              <motion.div
                key="picker"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <label
                  htmlFor="story-file-upload"
                  data-ocid="story.upload.dropzone"
                  className="border-2 border-dashed border-border hover:border-vibe-purple/60 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all py-16 px-8 text-center hover:bg-secondary/30"
                >
                  <div className="gradient-bg rounded-2xl p-5 mb-5 shadow-glow">
                    <ImagePlus size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold font-display mb-1.5">
                    Share a story
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                    Tap to choose a photo or video
                  </p>
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                      <ImagePlus size={11} /> Photo
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                      <Video size={11} /> Video
                    </span>
                  </div>
                </label>
                <input
                  id="story-file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleInputChange}
                  className="hidden"
                  data-ocid="story.upload.upload_button"
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Preview */}
                <div className="relative rounded-2xl overflow-hidden bg-secondary aspect-[9/16] max-h-[60dvh] mx-auto w-full">
                  {isVideo ? (
                    // biome-ignore lint/a11y/useMediaCaption: user-generated content
                    <video
                      src={preview!}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={preview!}
                      alt="Story preview"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Media badge */}
                  <div className="absolute top-3 left-3">
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

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm hover:bg-black/80 transition-colors"
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Close Friends toggle */}
                <div className="flex items-center gap-3 py-2.5 px-1 bg-card rounded-2xl border border-border">
                  <div
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ background: "oklch(0.55 0.2 150)" }}
                  />
                  <Label
                    htmlFor="cf-toggle"
                    className="flex-1 text-sm font-medium cursor-pointer"
                  >
                    Close Friends only
                  </Label>
                  <Switch
                    id="cf-toggle"
                    checked={isCloseFriendsOnly}
                    onCheckedChange={setIsCloseFriendsOnly}
                    data-ocid="story.upload.cf.switch"
                  />
                </div>

                {/* Upload progress */}
                {isUploading && uploadProgress > 0 && (
                  <div
                    className="space-y-1.5"
                    data-ocid="story.upload.loading_state"
                  >
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading story...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5" />
                  </div>
                )}

                {/* Success */}
                <AnimatePresence>
                  {uploadDone && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 py-2 text-emerald-400"
                      data-ocid="story.upload.success_state"
                    >
                      <CheckCircle2 size={18} />
                      <span className="text-sm font-semibold">
                        Story shared!
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Share button */}
                <Button
                  data-ocid="story.upload.submit_button"
                  onClick={handleSubmit}
                  disabled={isUploading || uploadDone}
                  className="w-full btn-gradient border-0 font-semibold h-12 text-base"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={17} className="animate-spin mr-2" />
                      Sharing...
                    </>
                  ) : (
                    "Share Story ✨"
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
