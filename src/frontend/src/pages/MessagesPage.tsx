import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Principal } from "@dfinity/principal";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Message, UserId } from "../backend.d";
import { AvatarWithRing } from "../components/AvatarWithRing";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useConversation,
  useGetUserProfile,
  useRecentConversations,
  useSendMessage,
} from "../hooks/useQueries";
import { formatRelativeTime } from "../utils/helpers";

function ConversationItem({
  userId,
  isSelected,
  onSelect,
}: {
  userId: UserId;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { data: profile } = useGetUserProfile(userId);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors",
        isSelected ? "bg-vibe-purple/10" : "hover:bg-secondary/50",
      )}
    >
      <AvatarWithRing profile={profile} size="md" showRing={isSelected} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-display truncate">
          {profile?.displayName || "..."}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          @{profile?.username || "..."}
        </p>
      </div>
    </button>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
          isOwn
            ? "gradient-bg text-white rounded-br-sm"
            : "bg-secondary text-foreground rounded-bl-sm",
        )}
      >
        <p className="leading-relaxed">{message.text}</p>
        <p
          className={cn(
            "text-[10px] mt-1",
            isOwn ? "text-white/60 text-right" : "text-muted-foreground",
          )}
        >
          {formatRelativeTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function ChatView({
  userId,
  onBack,
}: {
  userId: UserId;
  onBack: () => void;
}) {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetUserProfile(userId);
  const { data: messages = [], isLoading } = useConversation(userId);
  const sendMessage = useSendMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentPrincipal = identity?.getPrincipal().toString();

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText("");
    await sendMessage.mutateAsync({ receiverId: userId, text: msg });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-border"
        style={{
          background: "oklch(0.14 0.008 260 / 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground p-1 lg:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <AvatarWithRing profile={profile} size="sm" showRing />
        <div>
          <p className="text-sm font-semibold font-display">
            {profile?.displayName || "..."}
          </p>
          <p className="text-xs text-muted-foreground">
            @{profile?.username || "..."}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="space-y-3" data-ocid="messages.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  i % 2 === 0 ? "justify-end" : "justify-start",
                )}
              >
                <Skeleton
                  className={cn(
                    "h-10 rounded-2xl",
                    i % 2 === 0 ? "w-48" : "w-40",
                  )}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-40 text-center"
            data-ocid="messages.empty_state"
          >
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hi! 👋
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <MessageBubble
                key={message.id.toString()}
                message={message}
                isOwn={message.senderId.toString() === currentPrincipal}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex gap-2">
        <Input
          data-ocid="messages.input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          className="flex-1 bg-secondary border-border text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          size="icon"
          data-ocid="messages.send.button"
          onClick={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
          className="btn-gradient shrink-0"
        >
          {sendMessage.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </div>
    </div>
  );
}

export function MessagesPage() {
  const { data: conversationUserIds = [], isLoading } =
    useRecentConversations();
  const [selectedUserId, setSelectedUserId] = useState<UserId | null>(null);

  // Check for URL params for direct navigation
  useEffect(() => {
    const url = new URL(window.location.href);
    const userId = url.searchParams.get("userId");
    if (userId) {
      try {
        setSelectedUserId(Principal.fromText(userId));
      } catch {}
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-safe">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3 border-b border-border flex items-center"
        style={{
          background: "oklch(0.14 0.008 260 / 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {selectedUserId && (
          <button
            type="button"
            onClick={() => setSelectedUserId(null)}
            className="text-muted-foreground hover:text-foreground p-1 mr-2 lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-xl font-bold font-display">Messages</h1>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedUserId ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col bg-background"
            >
              <ChatView
                userId={selectedUserId}
                onBack={() => setSelectedUserId(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              {isLoading ? (
                <div
                  className="space-y-0"
                  data-ocid="messages.list.loading_state"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversationUserIds.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-20 text-center px-6"
                  data-ocid="messages.empty_state"
                >
                  <div className="gradient-bg rounded-3xl p-6 mb-5 shadow-glow">
                    <MessageSquare size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-2">
                    No messages yet
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Follow users and start a conversation from their profile
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {conversationUserIds.map((userId) => (
                    <ConversationItem
                      key={userId.toString()}
                      userId={userId}
                      isSelected={false}
                      onSelect={() => setSelectedUserId(userId)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
