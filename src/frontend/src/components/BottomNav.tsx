import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { Clapperboard, Compass, Home, PlusSquare, User } from "lucide-react";

interface BottomNavProps {
  onUploadClick: () => void;
}

export function BottomNav({ onUploadClick }: BottomNavProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
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

        {/* Profile */}
        <Link
          to="/profile"
          data-ocid="nav.profile.link"
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all",
            isActive("/profile")
              ? "text-vibe-purple"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <User
            size={22}
            className={isActive("/profile") ? "fill-current" : ""}
          />
          <span className="text-[10px] font-semibold font-body">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
