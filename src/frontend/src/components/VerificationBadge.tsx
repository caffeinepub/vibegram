import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";

interface VerificationBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export function VerificationBadge({
  size = "sm",
  className,
}: VerificationBadgeProps) {
  return (
    <BadgeCheck
      className={cn(
        "inline-block shrink-0 text-sky-400 fill-sky-400 stroke-white",
        size === "sm" ? "w-4 h-4" : "w-5 h-5",
        className,
      )}
    />
  );
}
