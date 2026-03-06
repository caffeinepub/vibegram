import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clapperboard,
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
import { useCreatePost } from "../hooks/useQueries";
import { CreativeToolbar } from "./CreativeToolbar";
import { MediaOverlayCanvas, type Overlay } from "./MediaOverlayCanvas";

interface ReelUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReelUploadSheet({ open, onOpenChange }: ReelUploadSheetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [collabUser, setCollabUser] = useState("");
  const [tagPeople, setTagPeople] = useState("");
  const [locationTag, setLocationTag] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [filterStyle, setFilterStyle] = useState("");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedSong, setSelectedSong] = useState<{
    title: string;
    artist: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith("video/")) {
        toast.error("Reels only support video files");
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

      // Reels use '__reel__' prefix so they can be filtered in the Reels page
      let reelCaption = caption.trim()
        ? `__reel__${caption.trim()}`
        : "__reel__";
      if (collabUser.trim()) {
        const cu = collabUser.trim().startsWith("@")
          ? collabUser.trim()
          : `@${collabUser.trim()}`;
        reelCaption = `__reelcollab__${cu}__${reelCaption}`;
      }
      if (locationTag.trim()) reelCaption += `__loc__${locationTag.trim()}__`;
      if (tagPeople.trim()) {
        const tags = tagPeople
          .split(",")
          .map((t) => {
            const tr = t.trim();
            return tr.startsWith("@") ? tr : `@${tr}`;
          })
          .filter(Boolean)
          .join(",");
        if (tags) reelCaption += `__tags__${tags}__`;
      }

      await createPost.mutateAsync({
        media: blob,
        mediaType: MediaType.video,
        caption: reelCaption,
      });

      setUploadDone(true);
      toast.success("Reel shared! 🎬");
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || "Upload failed. Please try again.");
      setUploadProgress(0);
    }
  };

  const isUploading = createPost.isPending;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="h-[88dvh] rounded-t-3xl bg-background border-border p-0 overflow-hidden"
        data-ocid="reel.upload.sheet"
      >
        <SheetHeader className="px-5 py-4 border-b border-border flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Clapperboard size={18} style={{ color: "oklch(0.6 0.2 225)" }} />
            <SheetTitle className="font-display text-lg">New Reel</SheetTitle>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
            aria-label="Close"
            data-ocid="reel.upload.close_button"
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
                  htmlFor="reel-file-upload"
                  data-ocid="reel.upload.dropzone"
                  className="border-2 border-dashed border-border hover:border-vibe-blue/60 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all py-16 px-8 text-center hover:bg-secondary/30"
                >
                  <div
                    className="rounded-2xl p-5 mb-5 shadow-glow"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.6 0.2 225), oklch(0.55 0.18 240))",
                    }}
                  >
                    <Video size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold font-display mb-1.5">
                    Share a Reel
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                    Upload a vertical video up to 30 seconds
                  </p>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                    <Video size={11} /> Videos only · Max 50MB
                  </span>
                </label>
                <input
                  id="reel-file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleInputChange}
                  className="hidden"
                  data-ocid="reel.upload.upload_button"
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Preview */}
                <div className="relative rounded-2xl overflow-hidden bg-secondary aspect-[9/16] max-h-[50dvh] mx-auto w-full">
                  <MediaOverlayCanvas
                    overlays={overlays}
                    onRemoveOverlay={(id) =>
                      setOverlays((prev) => prev.filter((o) => o.id !== id))
                    }
                    filterStyle={filterStyle}
                    className="w-full h-full"
                  >
                    {/* biome-ignore lint/a11y/useMediaCaption: user-generated content preview */}
                    <video
                      src={preview!}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  </MediaOverlayCanvas>
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <span
                      className="text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm"
                      style={{ background: "oklch(0.6 0.2 225 / 0.8)" }}
                    >
                      <Clapperboard size={10} /> Reel
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm hover:bg-black/80 transition-colors"
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
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
                    style={{ background: "oklch(0.6 0.2 225 / 0.12)" }}
                  >
                    <Music2
                      size={15}
                      style={{ color: "oklch(0.75 0.2 225)" }}
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
                <Textarea
                  data-ocid="reel.upload.caption.textarea"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption for your reel... 🎬"
                  className="bg-secondary border-border resize-none text-sm"
                  rows={2}
                  maxLength={2200}
                />

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
                    data-ocid="reel.upload.collab.input"
                  />
                </div>

                {/* Tag people */}
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1.5">
                    <Tag size={13} className="text-muted-foreground" /> Tag
                    People
                  </Label>
                  <Input
                    value={tagPeople}
                    onChange={(e) => setTagPeople(e.target.value)}
                    placeholder="@user1, @user2"
                    className="bg-secondary border-border text-sm"
                    data-ocid="reel.upload.tags.input"
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
                    data-ocid="reel.upload.location.input"
                  />
                </div>

                {/* Upload progress */}
                {isUploading && uploadProgress > 0 && (
                  <div
                    className="space-y-1.5"
                    data-ocid="reel.upload.loading_state"
                  >
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading reel...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5" />
                  </div>
                )}

                <AnimatePresence>
                  {uploadDone && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 py-2 text-emerald-400"
                      data-ocid="reel.upload.success_state"
                    >
                      <CheckCircle2 size={18} />
                      <span className="text-sm font-semibold">
                        Reel shared!
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  data-ocid="reel.upload.submit_button"
                  onClick={handleSubmit}
                  disabled={isUploading || uploadDone}
                  className="w-full border-0 font-semibold h-12 text-base text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.6 0.2 225), oklch(0.62 0.22 295))",
                  }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={17} className="animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    "Share Reel 🎬"
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
