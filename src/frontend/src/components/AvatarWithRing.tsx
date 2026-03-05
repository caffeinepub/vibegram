import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserProfile } from "../backend.d";
import { getAvatarGradient, getInitials } from "../utils/helpers";

interface AvatarWithRingProps {
  profile: UserProfile | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showRing?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "h-7 w-7 text-xs",
  sm: "h-9 w-9 text-sm",
  md: "h-11 w-11 text-base",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

const ringPadding = {
  xs: "p-[2px]",
  sm: "p-[2px]",
  md: "p-[3px]",
  lg: "p-[3px]",
  xl: "p-[3px]",
};

export function AvatarWithRing({
  profile,
  size = "md",
  showRing = false,
  className,
}: AvatarWithRingProps) {
  const initials = profile
    ? getInitials(profile.displayName || profile.username || "U")
    : "?";
  const gradient = getAvatarGradient(profile?.username || "default");
  const photoUrl = profile?.profilePhoto?.getDirectURL();

  if (showRing) {
    return (
      <div
        className={cn("rounded-full gradient-bg", ringPadding[size], className)}
      >
        <Avatar className={cn(sizeClasses[size], "border-2 border-background")}>
          {photoUrl && (
            <AvatarImage src={photoUrl} alt={profile?.displayName} />
          )}
          <AvatarFallback
            className={cn(
              "bg-gradient-to-br text-white font-semibold font-display",
              gradient,
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt={profile?.displayName} />}
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br text-white font-semibold font-display",
          gradient,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
