import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BookImage, Clapperboard, Radio, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { UploadPage } from "../pages/UploadPage";
import { LiveStreamSheet } from "./LiveStreamSheet";
import { ReelUploadSheet } from "./ReelUploadSheet";
import { StoryUploadSheet } from "./StoryUploadSheet";

interface MediaCreationHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREATION_TYPES = [
  {
    id: "post",
    icon: BookImage,
    title: "Post",
    description: "Share a moment",
    gradient:
      "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.58 0.2 280))",
    glow: "oklch(0.62 0.22 295 / 0.35)",
  },
  {
    id: "story",
    icon: Sparkles,
    title: "Story",
    description: "Disappears in 24h",
    gradient:
      "linear-gradient(135deg, oklch(0.65 0.25 350), oklch(0.68 0.2 15))",
    glow: "oklch(0.65 0.25 350 / 0.35)",
  },
  {
    id: "reels",
    icon: Clapperboard,
    title: "Reels",
    description: "Short vertical video",
    gradient:
      "linear-gradient(135deg, oklch(0.6 0.2 225), oklch(0.55 0.18 240))",
    glow: "oklch(0.6 0.2 225 / 0.35)",
  },
  {
    id: "live",
    icon: Radio,
    title: "Live",
    description: "Go live now",
    gradient:
      "linear-gradient(135deg, oklch(0.62 0.24 18), oklch(0.68 0.2 35))",
    glow: "oklch(0.62 0.24 18 / 0.35)",
  },
] as const;

type CreationType = (typeof CREATION_TYPES)[number]["id"];

export function MediaCreationHub({
  open,
  onOpenChange,
}: MediaCreationHubProps) {
  const [postOpen, setPostOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);

  const handleSelect = (type: CreationType) => {
    onOpenChange(false);
    // Small delay so hub closes first
    setTimeout(() => {
      if (type === "post") setPostOpen(true);
      if (type === "story") setStoryOpen(true);
      if (type === "reels") setReelOpen(true);
      if (type === "live") setLiveOpen(true);
    }, 200);
  };

  return (
    <>
      {/* ─── Hub Sheet ─────────────────────────────────────────────────────── */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl bg-background border-border p-0 overflow-hidden"
          style={{ height: "auto", maxHeight: "60dvh" }}
          data-ocid="creation.hub.sheet"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Create</SheetTitle>
          </SheetHeader>

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <div className="px-5 pb-2">
            <h2 className="text-lg font-bold font-display gradient-text">
              Create
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              What do you want to share?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 px-5 pb-8 pt-3">
            {CREATION_TYPES.map((type, i) => {
              const Icon = type.icon;
              return (
                <motion.button
                  key={type.id}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  onClick={() => handleSelect(type.id)}
                  data-ocid={`creation.${type.id}.button`}
                  className="relative overflow-hidden rounded-2xl p-4 text-left transition-all active:scale-95"
                  style={{
                    background: "oklch(0.17 0.008 260)",
                    border: "1px solid oklch(0.28 0.015 270)",
                  }}
                >
                  {/* Subtle gradient glow background */}
                  <div
                    className="absolute inset-0 opacity-10 rounded-2xl"
                    style={{ background: type.gradient }}
                  />

                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 relative"
                    style={{
                      background: type.gradient,
                      boxShadow: `0 4px 16px ${type.glow}`,
                    }}
                  >
                    <Icon size={22} className="text-white" />
                  </div>

                  <p className="font-bold font-display text-base text-foreground">
                    {type.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {type.description}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Post Upload ────────────────────────────────────────────────────── */}
      <Sheet open={postOpen} onOpenChange={setPostOpen}>
        <SheetContent
          side="bottom"
          className="h-[90dvh] rounded-t-3xl bg-background border-border p-0 overflow-hidden"
          data-ocid="upload.sheet"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>New Post</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-y-auto scrollbar-none">
            <UploadPage onSuccess={() => setPostOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Story Upload ───────────────────────────────────────────────────── */}
      <StoryUploadSheet open={storyOpen} onOpenChange={setStoryOpen} />

      {/* ─── Reel Upload ────────────────────────────────────────────────────── */}
      <ReelUploadSheet open={reelOpen} onOpenChange={setReelOpen} />

      {/* ─── Live Stream ────────────────────────────────────────────────────── */}
      <LiveStreamSheet open={liveOpen} onOpenChange={setLiveOpen} />
    </>
  );
}
