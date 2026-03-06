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
import { Switch } from "@/components/ui/switch";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Link,
  Loader2,
  Music2,
  Smile,
  Type,
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

interface StoryUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type StoryCreationMode =
  | "options"
  | "camera"
  | "photo"
  | "text"
  | "song"
  | "link"
  | "stickers"
  | "preview";

const TEXT_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
];

const STORY_CREATION_OPTIONS = [
  {
    id: "camera" as const,
    icon: <Camera size={22} />,
    label: "Camera",
    gradient:
      "linear-gradient(135deg, oklch(0.55 0.22 255), oklch(0.5 0.18 230))",
  },
  {
    id: "photo" as const,
    icon: <ImagePlus size={22} />,
    label: "Photo",
    gradient:
      "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
  },
  {
    id: "text" as const,
    icon: <Type size={22} />,
    label: "Text",
    gradient:
      "linear-gradient(135deg, oklch(0.65 0.18 30), oklch(0.62 0.22 350))",
  },
  {
    id: "song" as const,
    icon: <Music2 size={22} />,
    label: "Song",
    gradient:
      "linear-gradient(135deg, oklch(0.55 0.2 150), oklch(0.5 0.22 200))",
  },
  {
    id: "link" as const,
    icon: <Link size={22} />,
    label: "Social Link",
    gradient:
      "linear-gradient(135deg, oklch(0.5 0.2 230), oklch(0.55 0.22 265))",
  },
  {
    id: "stickers" as const,
    icon: <Smile size={22} />,
    label: "Stickers",
    gradient: "linear-gradient(135deg, oklch(0.7 0.2 80), oklch(0.65 0.22 50))",
  },
];

export function StoryUploadSheet({
  open,
  onOpenChange,
}: StoryUploadSheetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [isCloseFriendsOnly, setIsCloseFriendsOnly] = useState(false);
  const [filterStyle, setFilterStyle] = useState("");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedSong, setSelectedSong] = useState<{
    title: string;
    artist: string;
  } | null>(null);

  // Creation mode state
  const [creationMode, setCreationMode] =
    useState<StoryCreationMode>("options");

  // Text story state
  const [textStoryText, setTextStoryText] = useState("");
  const [textStoryGradient, setTextStoryGradient] = useState(TEXT_GRADIENTS[0]);

  // Social link state
  const [socialLinkUrl, setSocialLinkUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
      setCreationMode("preview");
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
    setFilterStyle("");
    setOverlays([]);
    setSelectedSong(null);
    setCreationMode("options");
    setTextStoryText("");
    setSocialLinkUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleClose = () => {
    handleClear();
    onOpenChange(false);
  };

  const handleOptionSelect = (id: StoryCreationMode) => {
    if (id === "camera") {
      cameraInputRef.current?.click();
    } else if (id === "photo") {
      fileInputRef.current?.click();
    } else {
      setCreationMode(id);
    }
  };

  const handleTextStoryShare = () => {
    if (!textStoryText.trim()) {
      toast.error("Please enter some text");
      return;
    }
    toast.success("Text story shared! ✨");
    handleClose();
  };

  const handleSocialLinkAdd = () => {
    if (!socialLinkUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    setOverlays((prev) => [
      ...prev,
      {
        id: `link-${Date.now()}`,
        type: "sticker",
        content: `🔗 ${socialLinkUrl.trim()}`,
        x: 20,
        y: 50,
      },
    ]);
    setSocialLinkUrl("");
    toast.success("Link sticker added! 🔗");
    setCreationMode("options");
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

        {/* Hidden file inputs */}
        <input
          id="story-file-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleInputChange}
          className="hidden"
          data-ocid="story.upload.upload_button"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
          data-ocid="story.upload.camera_button"
        />

        <div className="flex-1 px-5 py-6 space-y-5 overflow-y-auto scrollbar-none h-full pb-24">
          <AnimatePresence mode="wait">
            {/* OPTIONS SCREEN */}
            {creationMode === "options" && (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                {/* Instagram-style creation options grid */}
                <div>
                  <p className="text-xs text-muted-foreground mb-4 font-medium tracking-wide uppercase">
                    Create a Story
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {STORY_CREATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleOptionSelect(opt.id)}
                        data-ocid={`story.creation.${opt.id}.button`}
                        className="flex flex-col items-center gap-2.5 py-4 rounded-2xl transition-all active:scale-95 hover:opacity-90"
                        style={{
                          background: "oklch(0.16 0.015 265)",
                          border: "1px solid oklch(0.22 0.015 280 / 0.6)",
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                          style={{ background: opt.gradient }}
                        >
                          {opt.icon}
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drag & drop zone */}
                <div>
                  <p className="text-xs text-muted-foreground mb-3 font-medium tracking-wide uppercase">
                    Or upload a file
                  </p>
                  <label
                    htmlFor="story-file-upload"
                    data-ocid="story.upload.dropzone"
                    className="border-2 border-dashed border-border hover:border-vibe-purple/60 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all py-10 px-8 text-center hover:bg-secondary/30"
                  >
                    <div
                      className="rounded-2xl p-4 mb-4 shadow-glow"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                      }}
                    >
                      <ImagePlus size={24} className="text-white" />
                    </div>
                    <h3 className="text-base font-bold font-display mb-1">
                      Drag & drop or tap
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Photo or video up to 50MB
                    </p>
                  </label>
                </div>
              </motion.div>
            )}

            {/* TEXT STORY */}
            {creationMode === "text" && (
              <motion.div
                key="text-story"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <button
                  type="button"
                  onClick={() => setCreationMode("options")}
                  data-ocid="story.text.back.button"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>

                <h3 className="text-base font-bold font-display">Text Story</h3>

                {/* Preview */}
                <div
                  className="relative rounded-2xl aspect-[9/16] max-h-[50dvh] mx-auto w-full flex items-center justify-center p-6 overflow-hidden"
                  style={{ background: textStoryGradient }}
                >
                  <p
                    className="text-white text-xl font-bold text-center leading-relaxed break-words"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
                  >
                    {textStoryText || "Your text here..."}
                  </p>
                </div>

                {/* Gradient picker */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Background
                  </p>
                  <div className="flex gap-2">
                    {TEXT_GRADIENTS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setTextStoryGradient(g)}
                        data-ocid="story.text.gradient.button"
                        className="w-10 h-10 rounded-full shrink-0 border-2 transition-all"
                        style={{
                          background: g,
                          borderColor:
                            textStoryGradient === g ? "white" : "transparent",
                          transform:
                            textStoryGradient === g
                              ? "scale(1.15)"
                              : "scale(1)",
                        }}
                        aria-label="Choose gradient"
                      />
                    ))}
                  </div>
                </div>

                {/* Text input */}
                <textarea
                  value={textStoryText}
                  onChange={(e) => setTextStoryText(e.target.value)}
                  placeholder="What's on your mind?"
                  maxLength={200}
                  rows={3}
                  data-ocid="story.text.textarea"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <Button
                  type="button"
                  data-ocid="story.text.share.button"
                  onClick={handleTextStoryShare}
                  disabled={!textStoryText.trim()}
                  className="w-full btn-gradient border-0 font-semibold h-12 text-base"
                >
                  Share Text Story ✨
                </Button>
              </motion.div>
            )}

            {/* SONG SELECTION (shows music tab of CreativeToolbar) */}
            {creationMode === "song" && (
              <motion.div
                key="song-picker"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCreationMode("options")}
                    data-ocid="story.song.back.button"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back
                  </button>
                  {selectedSong && (
                    <button
                      type="button"
                      onClick={() => setCreationMode("options")}
                      data-ocid="story.song.done.button"
                      className="text-sm font-semibold text-white px-3 py-1.5 rounded-full"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                      }}
                    >
                      Done ✓
                    </button>
                  )}
                </div>

                <h3 className="text-base font-bold font-display">
                  Pick a Song
                </h3>

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
                  onMusicSelect={(song) => {
                    setSelectedSong(song);
                    if (song) {
                      toast.success(`Song added: ${song.title}`);
                    }
                  }}
                  selectedFilter={filterStyle}
                  selectedSong={selectedSong}
                />
              </motion.div>
            )}

            {/* SOCIAL LINK */}
            {creationMode === "link" && (
              <motion.div
                key="social-link"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <button
                  type="button"
                  onClick={() => setCreationMode("options")}
                  data-ocid="story.link.back.button"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>

                <h3 className="text-base font-bold font-display">
                  Add Social Link
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add a clickable link sticker to your story
                </p>

                <div className="space-y-3">
                  <div className="relative">
                    <Link
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      data-ocid="story.link.url.input"
                      value={socialLinkUrl}
                      onChange={(e) => setSocialLinkUrl(e.target.value)}
                      placeholder="https://instagram.com/yourprofile"
                      type="url"
                      className="bg-secondary border-border pl-10 h-12"
                    />
                  </div>

                  {socialLinkUrl && (
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{
                        background: "oklch(0.45 0.18 250 / 0.2)",
                        border: "1px solid oklch(0.45 0.18 250 / 0.4)",
                      }}
                    >
                      <Link size={14} className="text-blue-400 shrink-0" />
                      <span className="text-xs text-blue-300 truncate font-semibold">
                        {socialLinkUrl}
                      </span>
                    </div>
                  )}

                  <Button
                    type="button"
                    data-ocid="story.link.add.button"
                    onClick={handleSocialLinkAdd}
                    disabled={!socialLinkUrl.trim()}
                    className="w-full btn-gradient border-0 font-semibold h-12"
                  >
                    Add Link Sticker 🔗
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STICKERS (shows stickers tab) */}
            {creationMode === "stickers" && (
              <motion.div
                key="stickers"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCreationMode("options")}
                    data-ocid="story.stickers.back.button"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode("options")}
                    data-ocid="story.stickers.done.button"
                    className="text-sm font-semibold text-white px-3 py-1.5 rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                    }}
                  >
                    Done
                  </button>
                </div>

                <h3 className="text-base font-bold font-display">Stickers</h3>

                <CreativeToolbar
                  onFilterSelect={setFilterStyle}
                  onStickerAdd={(emoji) => {
                    setOverlays((prev) => [
                      ...prev,
                      {
                        id: `sticker-${Date.now()}-${Math.random()}`,
                        type: "sticker",
                        content: emoji,
                        x: 40,
                        y: 40,
                      },
                    ]);
                    toast.success("Sticker added!");
                  }}
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
              </motion.div>
            )}

            {/* PREVIEW (file selected) */}
            {creationMode === "preview" && selectedFile && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleClear}
                  data-ocid="story.preview.back.button"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Change media
                </button>

                {/* Preview */}
                <div className="relative rounded-2xl overflow-hidden bg-secondary aspect-[9/16] max-h-[55dvh] mx-auto w-full">
                  <MediaOverlayCanvas
                    overlays={overlays}
                    onRemoveOverlay={(id) =>
                      setOverlays((prev) => prev.filter((o) => o.id !== id))
                    }
                    filterStyle={filterStyle}
                    className="w-full h-full"
                  >
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
                  </MediaOverlayCanvas>

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
                    style={{ background: "oklch(0.62 0.22 295 / 0.12)" }}
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
