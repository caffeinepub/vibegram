import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Lock,
  LogOut,
  MessageSquare,
  Moon,
  Shield,
  Sun,
  UserCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useSearchUsers } from "../hooks/useQueries";

const VG_THEME_KEY = "vg_theme";
const VG_BLOCKED_KEY = "vg_blocked_users";
const VG_CLOSE_FRIENDS_KEY = "vg_close_friends";

function getLocalList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function setLocalList(key: string, list: string[]) {
  localStorage.setItem(key, JSON.stringify(list));
}

// ─── Section ──────────────────────────────────────────────────────────────────

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">
        {title}
      </p>
      <div className="bg-card rounded-2xl overflow-hidden border border-border mx-3">
        {children}
      </div>
    </section>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function SettingsRow({
  icon: Icon,
  label,
  value,
  onClick,
  children,
  destructive,
  className,
}: {
  icon?: React.FC<{ size?: number; className?: string }>;
  label: string;
  value?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  destructive?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick && !children}
      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${onClick ? "hover:bg-secondary/50" : "cursor-default"} ${destructive ? "text-destructive" : ""} ${className || ""}`}
    >
      {Icon && (
        <Icon
          size={18}
          className={destructive ? "text-destructive" : "text-muted-foreground"}
        />
      )}
      <span
        className={`flex-1 text-sm font-medium ${destructive ? "text-destructive" : "text-foreground"}`}
      >
        {label}
      </span>
      {value && <span className="text-sm text-muted-foreground">{value}</span>}
      {children}
      {onClick && !children && (
        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
      )}
    </button>
  );
}

// ─── Expandable Section ───────────────────────────────────────────────────────

function ExpandableSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left"
      >
        <span className="flex-1 text-sm font-medium">{title}</span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();

  const principalStr = identity?.getPrincipal().toString() ?? "";

  // Theme
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem(VG_THEME_KEY) !== "light",
  );
  const handleThemeToggle = (dark: boolean) => {
    setIsDark(dark);
    localStorage.setItem(VG_THEME_KEY, dark ? "dark" : "light");
    toast.success(dark ? "Dark mode enabled" : "Light mode enabled");
  };

  // Privacy
  const [privateAccount, setPrivateAccount] = useState(false);
  const [storyPrivacy, setStoryPrivacy] = useState("everyone");

  // Close friends
  const [cfList, setCfList] = useState<string[]>(() =>
    getLocalList(VG_CLOSE_FRIENDS_KEY),
  );
  const [cfSearch, setCfSearch] = useState("");
  const { data: cfResults = [] } = useSearchUsers(
    cfSearch.length >= 2 ? cfSearch : "",
  );
  const addCloseFriend = (username: string) => {
    if (!cfList.includes(username)) {
      const next = [...cfList, username];
      setCfList(next);
      setLocalList(VG_CLOSE_FRIENDS_KEY, next);
      toast.success(`${username} added to Close Friends`);
    }
    setCfSearch("");
  };
  const removeCloseFriend = (username: string) => {
    const next = cfList.filter((u) => u !== username);
    setCfList(next);
    setLocalList(VG_CLOSE_FRIENDS_KEY, next);
  };

  // Blocked users
  const [blockedList, setBlockedList] = useState<string[]>(() =>
    getLocalList(VG_BLOCKED_KEY),
  );
  const unblockUser = (username: string) => {
    const next = blockedList.filter((u) => u !== username);
    setBlockedList(next);
    setLocalList(VG_BLOCKED_KEY, next);
    toast.success(`${username} unblocked`);
  };

  // Verification dialog
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyReason, setVerifyReason] = useState("");

  // Feedback dialog
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const handleLogout = () => {
    clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const handleVerifySubmit = () => {
    if (!verifyReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    localStorage.setItem(
      `vg_verify_request_${principalStr}`,
      JSON.stringify({
        reason: verifyReason,
        date: Date.now(),
        username: profile?.username,
      }),
    );
    toast.success("Verification request submitted! 🎉");
    setVerifyOpen(false);
    setVerifyReason("");
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) {
      toast.error("Please write some feedback");
      return;
    }
    toast.success("Feedback sent! Thank you 💜");
    setFeedbackOpen(false);
    setFeedbackText("");
  };

  return (
    <div className="flex flex-col min-h-screen pb-safe bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3 border-b border-border flex items-center gap-3"
        style={{
          background: "oklch(0.14 0.008 260 / 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/profile" })}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
          aria-label="Back"
          data-ocid="settings.back.button"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold font-display">Settings</h1>
      </header>

      <main className="flex-1 py-4 space-y-5">
        {/* ── Account ───────────────────────────────────────────────────────── */}
        <SettingsSection title="Account">
          <SettingsRow
            label="Username"
            value={profile?.username ? `@${profile.username}` : "—"}
          />
          <Separator className="bg-border" />
          <SettingsRow
            icon={UserCheck}
            label="Edit Profile"
            onClick={() => {
              navigate({ to: "/profile" });
              toast.info("Tap Edit Profile on your profile page");
            }}
            data-ocid="settings.edit_profile.button"
          />
        </SettingsSection>

        {/* ── Privacy ───────────────────────────────────────────────────────── */}
        <SettingsSection title="Privacy">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Lock size={18} className="text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Private Account</span>
            <Switch
              checked={privateAccount}
              onCheckedChange={setPrivateAccount}
              data-ocid="settings.private.switch"
            />
          </div>
          <Separator className="bg-border" />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Users size={18} className="text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Story Privacy</span>
            <Select value={storyPrivacy} onValueChange={setStoryPrivacy}>
              <SelectTrigger
                className="w-36 h-8 text-xs bg-secondary border-border"
                data-ocid="settings.story_privacy.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers</SelectItem>
                <SelectItem value="close_friends">Close Friends</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SettingsSection>

        {/* ── Close Friends ─────────────────────────────────────────────────── */}
        <SettingsSection title="Close Friends">
          <div className="px-4 py-3 space-y-3">
            <div className="relative">
              <Input
                value={cfSearch}
                onChange={(e) => setCfSearch(e.target.value)}
                placeholder="Search to add friends..."
                className="bg-secondary border-border text-sm pr-8"
                data-ocid="settings.cf_search.input"
              />
              {cfSearch && (
                <button
                  type="button"
                  onClick={() => setCfSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Search results */}
            {cfSearch.length >= 2 && cfResults.length > 0 && (
              <div className="space-y-1">
                {cfResults.slice(0, 4).map((u) => (
                  <div
                    key={u.username}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm">@{u.username}</span>
                    <Button
                      size="sm"
                      onClick={() => addCloseFriend(u.username)}
                      className="h-7 text-xs btn-gradient border-0"
                      data-ocid="settings.cf_add.button"
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Current list */}
            {cfList.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  {cfList.length} close{" "}
                  {cfList.length === 1 ? "friend" : "friends"}
                </p>
                {cfList.map((username) => (
                  <div
                    key={username}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ background: "oklch(0.55 0.2 150)" }}
                      />
                      <span className="text-sm text-foreground">
                        @{username}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCloseFriend(username)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Remove ${username}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-1">
                No close friends added yet. Search above to add people.
              </p>
            )}
          </div>
        </SettingsSection>

        {/* ── Blocked Users ─────────────────────────────────────────────────── */}
        <SettingsSection title="Blocked Users">
          {blockedList.length === 0 ? (
            <div className="px-4 py-3.5 text-sm text-muted-foreground">
              No blocked users
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {blockedList.map((username, i) => (
                <div
                  key={username}
                  className="flex items-center gap-3 px-4 py-3"
                  data-ocid={`settings.blocked.item.${i + 1}`}
                >
                  <UserMinus
                    size={16}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="flex-1 text-sm">@{username}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unblockUser(username)}
                    className="h-7 text-xs border-border"
                    data-ocid={`settings.unblock.button.${i + 1}`}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SettingsSection>

        {/* ── Appearance ────────────────────────────────────────────────────── */}
        <SettingsSection title="Appearance">
          <div className="flex items-center gap-3 px-4 py-3.5">
            {isDark ? (
              <Moon size={18} className="text-muted-foreground" />
            ) : (
              <Sun size={18} className="text-muted-foreground" />
            )}
            <span className="flex-1 text-sm font-medium">Dark Mode</span>
            <Switch
              checked={isDark}
              onCheckedChange={handleThemeToggle}
              data-ocid="settings.dark_mode.switch"
            />
          </div>
        </SettingsSection>

        {/* ── Verification ──────────────────────────────────────────────────── */}
        <SettingsSection title="Verification">
          <SettingsRow
            icon={BadgeCheck}
            label="Request Verification"
            onClick={() => setVerifyOpen(true)}
            data-ocid="settings.verify.button"
          />
        </SettingsSection>

        {/* ── About ─────────────────────────────────────────────────────────── */}
        <SettingsSection title="About">
          <div className="flex items-center gap-4 px-4 py-4">
            <img
              src="/assets/uploads/InShot_20260306_023848346-1.png"
              alt="VibeGram"
              className="w-12 h-12 rounded-2xl object-cover"
            />
            <div>
              <p className="font-bold font-display text-base">VibeGram</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Version 2.0
              </p>
            </div>
          </div>
          <Separator className="bg-border" />
          <div className="px-4 py-3.5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A modern social media platform where users can share photos,
              videos, stories, reels, and live moments. It helps people connect,
              express creativity, and discover new content.
            </p>
          </div>
          <Separator className="bg-border" />
          <ExpandableSection title="Privacy Policy">
            <p>
              VibeGram respects user privacy and collects only necessary
              information such as username and profile details to operate the
              service. User data is stored securely on the Internet Computer
              blockchain and is not sold to third parties. Posts and media are
              shared based on your privacy settings.
            </p>
          </ExpandableSection>
          <Separator className="bg-border" />
          <ExpandableSection title="Terms & Conditions">
            <p>
              Users must follow community guidelines and must not upload
              illegal, harmful, or abusive content. VibeGram has the right to
              remove content or suspend accounts that violate platform rules. By
              using VibeGram, you agree to these terms.
            </p>
          </ExpandableSection>
        </SettingsSection>

        {/* ── Support ───────────────────────────────────────────────────────── */}
        <SettingsSection title="Support">
          <SettingsRow
            icon={Shield}
            label="Safety & Reporting"
            onClick={() => toast.info("Contact support for safety issues")}
          />
          <Separator className="bg-border" />
          <SettingsRow
            icon={MessageSquare}
            label="Send Feedback"
            onClick={() => setFeedbackOpen(true)}
            data-ocid="settings.feedback.button"
          />
        </SettingsSection>

        {/* ── Log Out ───────────────────────────────────────────────────────── */}
        <div className="mx-3">
          <button
            type="button"
            onClick={handleLogout}
            data-ocid="settings.logout.button"
            className="w-full bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built with ❤️ using caffeine.ai
            </a>
          </p>
        </div>
      </main>

      {/* ── Verification Dialog ──────────────────────────────────────────── */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.verify.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <BadgeCheck
                size={20}
                className="text-sky-400 fill-sky-400 stroke-white"
              />
              Request Verification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tell us why you should be verified. Our team will review your
              request.
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm">Reason for verification</Label>
              <Textarea
                value={verifyReason}
                onChange={(e) => setVerifyReason(e.target.value)}
                placeholder="I'm a public figure / brand / creator because..."
                className="bg-secondary border-border resize-none text-sm"
                rows={4}
                data-ocid="settings.verify.textarea"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setVerifyOpen(false)}
                className="flex-1 border-border"
                data-ocid="settings.verify.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifySubmit}
                className="flex-1 btn-gradient border-0"
                data-ocid="settings.verify.submit_button"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Feedback Dialog ──────────────────────────────────────────────── */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.feedback.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Send Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us what you love or what could be better..."
              className="bg-secondary border-border resize-none text-sm"
              rows={4}
              data-ocid="settings.feedback.textarea"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setFeedbackOpen(false)}
                className="flex-1 border-border"
                data-ocid="settings.feedback.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFeedbackSubmit}
                className="flex-1 btn-gradient border-0"
                data-ocid="settings.feedback.submit_button"
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
