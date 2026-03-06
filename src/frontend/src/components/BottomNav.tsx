import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Clapperboard,
  Compass,
  Home,
  PlusSquare,
  User,
  UserPlus,
} from "lucide-react";
import { useRef, useState } from "react";
import type { UserProfile } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { AvatarWithRing } from "./AvatarWithRing";

// ─── Account Switcher Sheet ───────────────────────────────────────────────────

function AccountSwitcherSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useGetCallerUserProfile();

  const handleLogoutAndNav = () => {
    clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-border pb-safe"
        style={{ background: "oklch(0.14 0.008 260)" }}
        data-ocid="account_switcher.sheet"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-lg">Accounts</SheetTitle>
        </SheetHeader>

        {/* Current account card */}
        <div
          className="flex items-center gap-3 p-4 rounded-2xl mb-4"
          style={{
            background: "oklch(0.18 0.012 265)",
            border: "1px solid oklch(0.28 0.015 270)",
          }}
        >
          <AvatarWithRing
            profile={profile as UserProfile | null | undefined}
            size="md"
            showRing
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold font-display truncate">
              {profile?.displayName || "You"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{profile?.username || "..."}
            </p>
          </div>
          {/* Active dot */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "oklch(0.72 0.18 150)" }}
            />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mb-4 px-2">
          To switch accounts, log out and sign back in with a different Internet
          Identity.
        </p>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleLogoutAndNav}
            data-ocid="account_switcher.switch_button"
            className="flex-1 h-11 rounded-2xl text-sm font-semibold border border-border text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
          >
            <User size={15} className="text-muted-foreground" />
            Switch Account
          </button>
          <button
            type="button"
            onClick={handleLogoutAndNav}
            data-ocid="account_switcher.add_button"
            className="flex-1 h-11 rounded-2xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
            }}
          >
            <UserPlus size={15} />
            Add Account
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

interface BottomNavProps {
  onUploadClick: () => void;
}

export function BottomNav({ onUploadClick }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const isActive = (path: string) => location.pathname === path;

  const handleProfilePointerDown = () => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setSwitcherOpen(true);
    }, 500);
  };

  const handleProfilePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleProfileClick = () => {
    if (!didLongPress.current) {
      navigate({ to: "/profile" });
    }
    didLongPress.current = false;
  };

  return (
    <>
      <AccountSwitcherSheet
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
      />
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 border-t border-border"
        style={{
          background: "oklch(0.14 0.008 260 / 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          height: "var(--nav-height)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-center justify-around h-full px-2">
          {/* Home */}
          <Link
            to="/"
            data-ocid="nav.home.link"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all",
              isActive("/")
                ? "text-vibe-purple"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Home size={22} className={isActive("/") ? "fill-current" : ""} />
            <span className="text-[10px] font-semibold font-body">Home</span>
          </Link>

          {/* Explore */}
          <Link
            to="/explore"
            data-ocid="nav.explore.link"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all",
              isActive("/explore")
                ? "text-vibe-purple"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Compass
              size={22}
              className={isActive("/explore") ? "fill-current" : ""}
            />
            <span className="text-[10px] font-semibold font-body">Explore</span>
          </Link>

          {/* Create (center, gradient) */}
          <button
            type="button"
            onClick={onUploadClick}
            data-ocid="nav.upload.button"
            className="flex flex-col items-center gap-0.5 px-1"
            aria-label="Create content"
          >
            <div className="gradient-bg rounded-2xl p-3 shadow-glow">
              <PlusSquare size={20} className="text-white" />
            </div>
          </button>

          {/* Reels */}
          <Link
            to="/reels"
            data-ocid="nav.reels.link"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all",
              isActive("/reels")
                ? "text-vibe-purple"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Clapperboard
              size={22}
              className={isActive("/reels") ? "fill-current" : ""}
            />
            <span className="text-[10px] font-semibold font-body">Reels</span>
          </Link>

          {/* Profile — tap to navigate, long-press to switch account */}
          <button
            type="button"
            data-ocid="nav.profile.link"
            data-ocid-long-press="nav.profile.switch_account.button"
            onPointerDown={handleProfilePointerDown}
            onPointerUp={handleProfilePointerUp}
            onPointerLeave={handleProfilePointerUp}
            onClick={handleProfileClick}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all select-none",
              isActive("/profile")
                ? "text-vibe-purple"
                : "text-muted-foreground hover:text-foreground",
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <User
              size={22}
              className={isActive("/profile") ? "fill-current" : ""}
            />
            <span className="text-[10px] font-semibold font-body">Profile</span>
          </button>
        </div>
      </nav>
    </>
  );
}
