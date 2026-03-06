import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Check, UserPlus, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { AvatarWithRing } from "../components/AvatarWithRing";
import { useSearchUsers } from "../hooks/useQueries";

// Mock users shown if the API returns nothing
const MOCK_USERS = [
  {
    id: "mock_1",
    username: "vibes_creator",
    displayName: "Vibes Creator",
    bio: "Photography & Lifestyle ✨",
  },
  {
    id: "mock_2",
    username: "photo_daily",
    displayName: "Photo Daily",
    bio: "A photo a day keeps the dull away 📸",
  },
  {
    id: "mock_3",
    username: "wanderlust_jaya",
    displayName: "Jaya Sharma",
    bio: "Traveller | Foodie | Creator 🌍",
  },
  {
    id: "mock_4",
    username: "tech_arjun",
    displayName: "Arjun Dev",
    bio: "Building the future, one line at a time 💻",
  },
  {
    id: "mock_5",
    username: "dance_priya",
    displayName: "Priya Moves",
    bio: "Dance is my language 💃",
  },
  {
    id: "mock_6",
    username: "foodie_raj",
    displayName: "Raj Eats",
    bio: "Life is short, eat good food 🍜",
  },
];

type MockUser = (typeof MOCK_USERS)[0];

export function DiscoverPeoplePage() {
  const navigate = useNavigate();
  const { data: apiUsers = [] } = useSearchUsers("a");

  // Use API users if any, else show mocks
  const displayUsers: MockUser[] =
    apiUsers.length > 0
      ? apiUsers.map((u) => ({
          id: u.username,
          username: u.username,
          displayName: u.displayName,
          bio: u.bio ?? "",
        }))
      : MOCK_USERS;

  // Track followed state locally
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const handleFollow = (userId: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const followedCount = followedIds.size;
  const hasEnough = followedCount >= 5;

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: "oklch(0.08 0.015 265)" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "oklch(0.62 0.28 340)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-12 blur-3xl"
          style={{ background: "oklch(0.55 0.22 295)" }}
        />
      </div>

      <div className="relative flex-1 flex flex-col px-5 py-8 max-w-md mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
              boxShadow: "0 0 32px oklch(0.62 0.22 295 / 0.35)",
            }}
          >
            <Users size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white mb-1.5">
            Discover People
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "oklch(0.6 0.04 265)" }}
          >
            Follow accounts to fill your feed with great content
          </p>
          {followedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: hasEnough
                  ? "oklch(0.55 0.2 150 / 0.2)"
                  : "oklch(0.62 0.22 295 / 0.15)",
                color: hasEnough
                  ? "oklch(0.75 0.2 150)"
                  : "oklch(0.72 0.18 295)",
              }}
            >
              {hasEnough ? <Check size={12} /> : <UserPlus size={12} />}
              {followedCount} followed
            </motion.div>
          )}
        </motion.div>

        {/* User cards list */}
        <div
          className="flex-1 space-y-3 overflow-y-auto pb-4"
          data-ocid="discover.list"
        >
          {displayUsers.map((user, idx) => {
            const isFollowed = followedIds.has(user.id);
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.35 }}
                data-ocid={`discover.item.${idx + 1}`}
                className="flex items-center gap-3 p-3.5 rounded-2xl"
                style={{
                  background: "oklch(0.13 0.012 260 / 0.85)",
                  border: "1px solid oklch(0.22 0.02 280 / 0.5)",
                }}
              >
                <AvatarWithRing
                  profile={null}
                  size="md"
                  showRing={isFollowed}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold font-display text-white truncate">
                    {user.displayName}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "oklch(0.55 0.03 265)" }}
                  >
                    @{user.username}
                  </p>
                  {user.bio && (
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: "oklch(0.5 0.03 265)" }}
                    >
                      {user.bio}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleFollow(user.id)}
                  data-ocid={`discover.follow.button.${idx + 1}`}
                  className="shrink-0 h-8 px-4 rounded-full text-xs font-bold transition-all active:scale-95"
                  style={
                    isFollowed
                      ? {
                          background: "oklch(0.18 0.015 265)",
                          color: "oklch(0.55 0.03 265)",
                          border: "1px solid oklch(0.25 0.02 280)",
                        }
                      : {
                          background:
                            "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                          color: "white",
                        }
                  }
                >
                  {isFollowed ? "Following" : "Follow"}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Footer actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="pt-4 space-y-3"
        >
          <Button
            onClick={() => navigate({ to: "/" })}
            data-ocid="discover.done.button"
            className="w-full h-12 font-bold text-sm tracking-wide border-0"
            style={{
              background: hasEnough
                ? "linear-gradient(135deg, oklch(0.55 0.2 150), oklch(0.6 0.22 165))"
                : "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
              color: "white",
            }}
          >
            {hasEnough ? (
              <>
                <Check size={16} className="mr-2" />
                Done ✓
              </>
            ) : followedCount > 0 ? (
              `Done (${followedCount}/5)`
            ) : (
              "Done"
            )}
          </Button>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            data-ocid="discover.skip.button"
            className="w-full text-center text-sm font-medium transition-opacity hover:opacity-70 py-1"
            style={{ color: "oklch(0.5 0.03 265)" }}
          >
            Skip for now
          </button>
        </motion.div>
      </div>
    </div>
  );
}
