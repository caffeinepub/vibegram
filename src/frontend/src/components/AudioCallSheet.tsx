import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserId } from "../backend.d";
import { useGetUserProfile } from "../hooks/useQueries";
import { AvatarWithRing } from "./AvatarWithRing";

interface AudioCallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: UserId;
}

type CallState = "ringing" | "connected" | "ended";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function AudioCallSheet({
  open,
  onOpenChange,
  userId,
}: AudioCallSheetProps) {
  const { data: profile } = useGetUserProfile(userId);
  const [callState, setCallState] = useState<CallState>("ringing");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setCallState("ringing");
    setDuration(0);
    setIsMuted(false);
    setIsSpeaker(true);

    // Auto-connect after 3s (simulate ringing)
    ringTimerRef.current = setTimeout(() => {
      setCallState("connected");
    }, 3000);

    return () => {
      if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open]);

  // Start timer when connected
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const handleEndCall = () => {
    setCallState("ended");
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      onOpenChange(false);
      toast.success("Call ended");
    }, 600);
  };

  const displayName = profile?.displayName || "User";
  const username = profile?.username || "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[95dvh] rounded-t-3xl p-0 overflow-hidden border-none"
        data-ocid="audio.call.sheet"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.1 0.04 295), oklch(0.08 0.03 340), oklch(0.09 0.03 260))",
        }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Audio Call</SheetTitle>
        </SheetHeader>

        {/* Ambient blobs */}
        <div
          className="absolute top-1/4 -left-20 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.62 0.22 295)" }}
        />
        <div
          className="absolute bottom-1/3 -right-20 w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.65 0.25 350)" }}
        />

        <div className="relative z-10 flex flex-col items-center justify-between h-full px-6 py-10">
          {/* Top section */}
          <div className="flex flex-col items-center gap-5">
            {/* Avatar with pulsing ring */}
            <div className="relative">
              {callState === "ringing" && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{
                      duration: 1.8,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                    }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{
                      duration: 1.8,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: 0.3,
                    }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                    }}
                  />
                </>
              )}
              <div
                className="w-24 h-24 rounded-full p-0.5 relative"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-secondary">
                  <AvatarWithRing
                    profile={profile}
                    size="lg"
                    showRing={false}
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="text-center">
              <h2 className="text-2xl font-bold font-display text-white">
                {displayName}
              </h2>
              {username && (
                <p className="text-sm text-white/60 mt-1">@{username}</p>
              )}
            </div>

            {/* Status */}
            <div className="text-center">
              {callState === "ringing" && (
                <motion.p
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{
                    duration: 1.2,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  className="text-sm text-white/70"
                >
                  Calling...
                </motion.p>
              )}
              {callState === "connected" && (
                <div className="flex flex-col items-center gap-1">
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: "oklch(0.55 0.2 150 / 0.3)",
                      color: "oklch(0.75 0.2 150)",
                    }}
                  >
                    Connected
                  </span>
                  <p className="text-2xl font-bold font-display text-white mt-2">
                    {formatDuration(duration)}
                  </p>
                </div>
              )}
              {callState === "ended" && (
                <p className="text-sm text-white/60">Call ended</p>
              )}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="flex items-center justify-center gap-6 w-full">
            {/* Mute */}
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              data-ocid="audio.call.mute.toggle"
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                isMuted ? "bg-white/20" : "bg-white/10 hover:bg-white/20",
              )}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff size={22} className="text-white" />
              ) : (
                <Mic size={22} className="text-white" />
              )}
            </button>

            {/* End call */}
            <button
              type="button"
              onClick={handleEndCall}
              data-ocid="audio.call.end.button"
              className="w-18 h-18 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{
                width: "72px",
                height: "72px",
                background:
                  "linear-gradient(135deg, oklch(0.55 0.25 18), oklch(0.6 0.22 35))",
                boxShadow: "0 0 24px oklch(0.55 0.25 18 / 0.5)",
              }}
              aria-label="End call"
            >
              <PhoneOff size={26} className="text-white" />
            </button>

            {/* Speaker */}
            <button
              type="button"
              onClick={() => setIsSpeaker((s) => !s)}
              data-ocid="audio.call.speaker.toggle"
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                isSpeaker ? "bg-white/20" : "bg-white/10 hover:bg-white/20",
              )}
              aria-label={isSpeaker ? "Speaker off" : "Speaker on"}
            >
              {isSpeaker ? (
                <Volume2 size={22} className="text-white" />
              ) : (
                <VolumeX size={22} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
