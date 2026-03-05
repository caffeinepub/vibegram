import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { NotificationType } from "../backend";
import type { Notification } from "../backend.d";
import { AvatarWithRing } from "../components/AvatarWithRing";
import {
  useGetUserProfile,
  useMarkNotificationsAsRead,
  useNotifications,
} from "../hooks/useQueries";
import { formatRelativeTime } from "../utils/helpers";

function NotificationIcon({ type }: { type: NotificationType }) {
  if (type === NotificationType.like) {
    return (
      <div className="bg-vibe-pink/20 rounded-full p-1.5">
        <Heart size={12} className="text-vibe-pink fill-current" />
      </div>
    );
  }
  if (type === NotificationType.comment) {
    return (
      <div className="bg-vibe-blue/20 rounded-full p-1.5">
        <MessageCircle size={12} className="text-vibe-blue fill-current" />
      </div>
    );
  }
  return (
    <div className="bg-vibe-purple/20 rounded-full p-1.5">
      <UserPlus size={12} className="text-vibe-purple" />
    </div>
  );
}

function NotificationText({ type }: { type: NotificationType }) {
  if (type === NotificationType.like) return <span>liked your post</span>;
  if (type === NotificationType.comment)
    return <span>commented on your post</span>;
  return <span>started following you</span>;
}

function NotificationItem({
  notification,
  index,
}: {
  notification: Notification;
  index: number;
}) {
  const { data: actor } = useGetUserProfile(notification.actorId);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-3 py-3.5 px-4 transition-colors",
        !notification.read && "bg-vibe-purple/5",
      )}
      data-ocid={`notifications.item.${index}`}
    >
      <div className="relative flex-shrink-0">
        <AvatarWithRing profile={actor} size="sm" />
        <div className="absolute -bottom-1 -right-1">
          <NotificationIcon type={notification.type} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-semibold">{actor?.username || "Someone"}</span>{" "}
          <span className="text-muted-foreground">
            <NotificationText type={notification.type} />
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {!notification.read && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: "oklch(var(--vibe-purple))" }}
        />
      )}
    </motion.div>
  );
}

export function NotificationsPage() {
  const { data: notifications = [], isLoading, isError } = useNotifications();
  const markAsRead = useMarkNotificationsAsRead();

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  const handleMarkAllRead = () => {
    const unreadIds = unread.map((n) => n.id);
    if (unreadIds.length > 0) {
      markAsRead.mutate(unreadIds);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3 border-b border-border flex items-center justify-between"
        style={{
          background: "oklch(0.14 0.008 260 / 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <h1 className="text-xl font-bold font-display">Notifications</h1>
        {unread.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            data-ocid="notifications.mark_read.button"
            onClick={handleMarkAllRead}
            disabled={markAsRead.isPending}
            className="text-xs text-vibe-purple hover:text-vibe-purple/80 font-semibold"
          >
            Mark all read
          </Button>
        )}
      </header>

      <main className="flex-1">
        {isLoading ? (
          <div
            className="space-y-0 pt-2"
            data-ocid="notifications.loading_state"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3.5 px-4">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center px-6"
            data-ocid="notifications.error_state"
          >
            <p className="text-lg font-semibold text-destructive">
              Failed to load notifications
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center px-6"
            data-ocid="notifications.empty_state"
          >
            <div className="gradient-bg rounded-3xl p-6 mb-5 shadow-glow">
              <Bell size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold font-display mb-2">
              All caught up!
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You don't have any notifications yet. Interact with others to
              start the fun!
            </p>
          </motion.div>
        ) : (
          <div>
            {/* VibeGram welcome banner */}
            <div
              className="mx-4 mt-3 mb-1 rounded-2xl overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.18 0.025 295), oklch(0.16 0.022 340))",
                border: "1px solid oklch(0.28 0.015 270)",
              }}
            >
              <div className="flex items-center gap-3 p-3.5">
                <img
                  src="/assets/uploads/InShot_20260306_023848346-1.png"
                  alt="VibeGram"
                  className="w-10 h-10 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">VibeGram</p>
                  <p className="text-xs text-white/70 mt-0.5 leading-snug">
                    Welcome to VibeGram 2.0! Now with Reels, Live, Stories &
                    more. 🎉
                  </p>
                </div>
              </div>
            </div>

            {/* Unread */}
            {unread.length > 0 && (
              <section>
                <div className="px-4 py-2 bg-secondary/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    New ({unread.length})
                  </p>
                </div>
                <div className="divide-y divide-border/40">
                  {unread.map((notification, i) => (
                    <NotificationItem
                      key={notification.id.toString()}
                      notification={notification}
                      index={i + 1}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Read */}
            {read.length > 0 && (
              <section>
                <div className="px-4 py-2 bg-secondary/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Earlier
                  </p>
                </div>
                <div className="divide-y divide-border/40">
                  {read.map((notification, i) => (
                    <NotificationItem
                      key={notification.id.toString()}
                      notification={notification}
                      index={unread.length + i + 1}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
