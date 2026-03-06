import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  Video,
  VideoOff,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserId } from "../backend.d";
import { useGetUserProfile } from "../hooks/useQueries";
import { AvatarWithRing } from "./AvatarWithRing";

interface VideoCallSheetProps {
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

export function VideoCallSheet({
  open,
  onOpenChange,
  userId,
}: VideoCallSheetProps) {
  const { data: profile } = useGetUserProfile(userId);
  const [callState, setCallState] = useState<CallState>("ringing");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request camera/microphone when sheet opens; release when it closes
  useEffect(() => {
    if (!open) {
      // Stop all tracks on close
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
        streamRef.current = null;
      }
      setCameraError(false);
      return;
    }

    setCallState("ringing");
    setDuration(0);
    setIsMuted(false);
    setIsCameraOn(true);
    setCameraError(false);

    // Attempt camera access
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (selfVideoRef.current) {
          selfVideoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setCameraError(true);
      });

    ringTimerRef.current = setTimeout(() => {
      setCallState("connected");
    }, 3000);

    return () => {
      if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open]);

  // When camera is toggled off, pause video tracks
  useEffect(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getVideoTracks()) {
        t.enabled = isCameraOn;
      }
    }
  }, [isCameraOn]);

  // When muted, mute audio tracks
  useEffect(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getAudioTracks()) {
        t.enabled = !isMuted;
      }
    }
  }, [isMuted]);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[95dvh] rounded-t-3xl p-0 overflow-hidden border-none"
        data-ocid="video.call.sheet"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.1 0.04 295), oklch(0.08 0.03 260), oklch(0.09 0.03 340))",
        }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Video Call</SheetTitle>
        </SheetHeader>

        <div className="relative h-full flex flex-col">
          {/* Remote video area */}
          <div
            className="flex-1 relative flex items-center justify-center overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.15 0.03 295), oklch(0.12 0.02 260))",
            }}
          >
            {/* Animated gradient when "camera on" */}
            {callState === "connected" ? (
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    "linear-gradient(135deg, oklch(0.14 0.04 295), oklch(0.18 0.03 340))",
                    "linear-gradient(135deg, oklch(0.18 0.03 340), oklch(0.14 0.04 225))",
                    "linear-gradient(135deg, oklch(0.14 0.04 225), oklch(0.14 0.04 295))",
                  ],
                }}
                transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
              />
            ) : null}

            {/* User avatar + name in center */}
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div
                className="w-24 h-24 rounded-full p-0.5"
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
              <p className="text-white font-display font-bold text-lg">
                {displayName}
              </p>
              {callState === "ringing" && (
                <motion.p
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{
                    duration: 1.2,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  className="text-white/60 text-sm"
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
                  <p className="text-white text-xl font-bold font-display mt-1">
                    {formatDuration(duration)}
                  </p>
                </div>
              )}
            </div>

            {/* Self camera preview (top-right) */}
            <div
              className={cn(
                "absolute top-4 right-4 w-28 h-40 rounded-xl overflow-hidden border-2 border-white/20",
                "flex items-center justify-center",
              )}
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.18 0.02 295), oklch(0.22 0.02 340))",
              }}
            >
              {cameraError ? (
                <div className="flex flex-col items-center gap-1.5 px-2 text-center">
                  <VideoOff size={18} className="text-white/50" />
                  <p className="text-white/50 text-[9px] leading-tight">
                    Camera access denied
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.mediaDevices
                        .getUserMedia({ video: true, audio: true })
                        .then((stream) => {
                          streamRef.current = stream;
                          if (selfVideoRef.current) {
                            selfVideoRef.current.srcObject = stream;
                          }
                          setCameraError(false);
                        })
                        .catch(() => setCameraError(true));
                    }}
                    className="text-[9px] text-white/70 underline"
                  >
                    Allow Camera
                  </button>
                </div>
              ) : isCameraOn ? (
                <video
                  ref={selfVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <VideoOff size={18} className="text-white/40" />
                  <p className="text-white/40 text-[10px]">Camera off</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls bar */}
          <div
            className="flex items-center justify-center gap-4 px-6 py-6"
            style={{ background: "oklch(0.08 0.02 260 / 0.8)" }}
          >
            {/* Mute */}
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              data-ocid="video.call.mute.toggle"
              className={cn(
                "w-13 h-13 rounded-full flex items-center justify-center transition-all",
                "w-12 h-12",
                isMuted ? "bg-white/20" : "bg-white/10 hover:bg-white/20",
              )}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff size={20} className="text-white" />
              ) : (
                <Mic size={20} className="text-white" />
              )}
            </button>

            {/* Camera toggle */}
            <button
              type="button"
              onClick={() => setIsCameraOn((c) => !c)}
              data-ocid="video.call.camera.toggle"
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                isCameraOn ? "bg-white/10 hover:bg-white/20" : "bg-white/20",
              )}
              aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {isCameraOn ? (
                <Video size={20} className="text-white" />
              ) : (
                <VideoOff size={20} className="text-white" />
              )}
            </button>

            {/* End call */}
            <button
              type="button"
              onClick={handleEndCall}
              data-ocid="video.call.end.button"
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.25 18), oklch(0.6 0.22 35))",
                boxShadow: "0 0 24px oklch(0.55 0.25 18 / 0.5)",
              }}
              aria-label="End call"
            >
              <PhoneOff size={24} className="text-white" />
            </button>

            {/* Switch camera */}
            <button
              type="button"
              onClick={() => toast.info("Camera switched!")}
              data-ocid="video.call.switch.button"
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all"
              aria-label="Switch camera"
            >
              <RotateCcw size={20} className="text-white" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
