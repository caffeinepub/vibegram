import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

// ─── QR Code Placeholder ───────────────────────────────────────────────────────

function QrCodePlaceholder({ username }: { username: string }) {
  // Generate a deterministic but decorative QR-ish grid pattern
  // from the username characters for visual variety
  const size = 9;
  const seed = username
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const cells: { id: string; filled: boolean }[] = Array.from(
    { length: size * size },
    (_, i) => {
      const row = Math.floor(i / size);
      const col = i % size;
      const isCorner =
        (row < 3 && col < 3) ||
        (row < 3 && col >= size - 3) ||
        (row >= size - 3 && col < 3);
      const isBorder =
        row === 0 || row === size - 1 || col === 0 || col === size - 1;
      const filled =
        isCorner || isBorder
          ? true
          : (seed * (i + 7) * 31337 + i * 1337) % 100 < 45;
      return { id: `r${row}c${col}`, filled };
    },
  );

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white p-3 shadow-lg"
      style={{ width: 120, height: 120 }}
      aria-label={`QR code for @${username}`}
    >
      <div
        className="grid w-full h-full gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
        }}
      >
        {cells.map((cell) => (
          <div
            key={cell.id}
            className={`rounded-[1px] ${cell.filled ? "bg-gray-900" : "bg-white"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── ShareProfileSheet ────────────────────────────────────────────────────────

export function ShareProfileSheet({
  open,
  onOpenChange,
  username,
  displayName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  username: string;
  displayName: string;
}) {
  const profileUrl = `https://vibegrom.app/@${username}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Link copied!", {
        description: profileUrl,
        duration: 2500,
      });
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on VibeGrom`,
          text: `Check out @${username} on VibeGrom!`,
          url: profileUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleDownloadCard = () => {
    toast.info("Download card", { description: "Coming soon!" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl bg-card border-border pb-8"
        data-ocid="profile.share.sheet"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-base text-center">
            Share Profile
          </SheetTitle>
        </SheetHeader>

        {/* Profile card */}
        <div className="mx-auto max-w-xs">
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.14 0.025 265), oklch(0.18 0.03 295))",
              border: "1px solid oklch(0.28 0.04 295 / 0.6)",
            }}
          >
            {/* Decorative background glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 70% 30%, oklch(0.62 0.22 295 / 0.18), transparent 60%), radial-gradient(circle at 20% 80%, oklch(0.65 0.25 350 / 0.15), transparent 55%)",
              }}
            />

            <div className="relative p-6 flex flex-col items-center gap-4">
              {/* VibeGrom logo */}
              <div className="text-center">
                <span
                  className="text-lg font-black tracking-tight font-display"
                  style={{
                    background:
                      "linear-gradient(90deg, oklch(0.75 0.22 295), oklch(0.75 0.25 350), oklch(0.7 0.2 225))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  VibeGrom
                </span>
              </div>

              {/* QR code */}
              <QrCodePlaceholder username={username} />

              {/* Username */}
              <div className="text-center">
                <p className="text-xl font-black font-display text-foreground">
                  @{username}
                </p>
                {displayName && displayName !== username && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {displayName}
                  </p>
                )}
              </div>

              {/* URL hint */}
              <p
                className="text-[11px] px-3 py-1 rounded-full font-mono truncate max-w-full"
                style={{
                  background: "oklch(0.22 0.015 280)",
                  color: "oklch(0.65 0.18 295)",
                }}
              >
                vibegrom.app/@{username}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 mt-5">
            <Button
              data-ocid="profile.share.copy_button"
              onClick={handleCopyLink}
              variant="outline"
              className="w-full h-11 border-border hover:bg-secondary font-semibold gap-2"
            >
              <Copy size={16} />
              Copy Link
            </Button>

            <Button
              data-ocid="profile.share.button"
              onClick={handleShare}
              className="w-full h-11 btn-gradient border-0 font-semibold gap-2"
            >
              <Share2 size={16} />
              Share Profile
            </Button>

            <Button
              onClick={handleDownloadCard}
              variant="ghost"
              className="w-full h-11 text-muted-foreground hover:text-foreground gap-2"
            >
              <Download size={16} />
              Download Card
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
