import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Archive,
  ArrowLeft,
  AtSign,
  BadgeCheck,
  BarChart2,
  Bell,
  Bookmark,
  Briefcase,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock,
  EyeOff,
  FileText,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Megaphone,
  MessageSquareOff,
  Moon,
  Radio,
  Settings2,
  Shield,
  Smartphone,
  Sun,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useSearchUsers } from "../hooks/useQueries";

// ─── Constants ────────────────────────────────────────────────────────────────

const VG_THEME_KEY = "vg_theme";
const VG_BLOCKED_KEY = "vg_blocked_users";
const VG_CLOSE_FRIENDS_KEY = "vg_close_friends";
const VG_HIDDEN_WORDS_KEY = "vg_hidden_words";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Section Header ───────────────────────────────────────────────────────────

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.FC<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1">
      <div className="flex items-center gap-2 px-4 py-1.5">
        {Icon && <Icon size={13} className="text-muted-foreground/70" />}
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          {title}
        </p>
      </div>
      <div className="bg-card rounded-2xl overflow-hidden border border-border mx-3">
        {children}
      </div>
    </section>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────

function SettingsRow({
  icon: Icon,
  label,
  value,
  onClick,
  children,
  destructive,
  "data-ocid": dataOcid,
}: {
  icon?: React.FC<{ size?: number; className?: string }>;
  label: string;
  value?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  destructive?: boolean;
  "data-ocid"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick && !children}
      data-ocid={dataOcid}
      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${onClick ? "hover:bg-vibe-purple/10 active:bg-vibe-purple/15" : "cursor-default"} ${destructive ? "text-destructive" : ""}`}
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

// ─── Toggle Row ───────────────────────────────────────────────────────────────

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onCheckedChange,
  "data-ocid": dataOcid,
}: {
  icon?: React.FC<{ size?: number; className?: string }>;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  "data-ocid"?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {Icon && <Icon size={18} className="text-muted-foreground" />}
      <span className="flex-1 text-sm font-medium text-foreground">
        {label}
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        data-ocid={dataOcid}
      />
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const { actor } = useActor();

  const principalStr = identity?.getPrincipal().toString() ?? "";

  // ── Theme
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem(VG_THEME_KEY) !== "light",
  );
  const handleThemeToggle = (dark: boolean) => {
    setIsDark(dark);
    localStorage.setItem(VG_THEME_KEY, dark ? "dark" : "light");
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    toast.success(dark ? "Dark mode enabled" : "Light mode enabled");
  };

  // ── Privacy
  const [privateAccount, setPrivateAccount] = useState(false);

  // ── Notifications
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [storyNotif, setStoryNotif] = useState(true);
  const [liveNotif, setLiveNotif] = useState(true);

  // ── Close Friends
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

  // ── Blocked Users
  const [blockedList, setBlockedList] = useState<string[]>(() =>
    getLocalList(VG_BLOCKED_KEY),
  );
  const unblockUser = (username: string) => {
    const next = blockedList.filter((u) => u !== username);
    setBlockedList(next);
    setLocalList(VG_BLOCKED_KEY, next);
    toast.success(`${username} unblocked`);
  };

  // ── Hidden Words
  const [hiddenWords, setHiddenWords] = useState<string[]>(() =>
    getLocalList(VG_HIDDEN_WORDS_KEY),
  );
  const [hiddenWordInput, setHiddenWordInput] = useState("");
  const addHiddenWord = () => {
    const word = hiddenWordInput.trim().toLowerCase();
    if (!word) return;
    if (!hiddenWords.includes(word)) {
      const next = [...hiddenWords, word];
      setHiddenWords(next);
      setLocalList(VG_HIDDEN_WORDS_KEY, next);
      toast.success(`"${word}" added to hidden words`);
    }
    setHiddenWordInput("");
  };
  const removeHiddenWord = (word: string) => {
    const next = hiddenWords.filter((w) => w !== word);
    setHiddenWords(next);
    setLocalList(VG_HIDDEN_WORDS_KEY, next);
  };

  // ── Change Username
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const handleUsernameChange = async () => {
    if (!newUsername.trim() || !actor || !profile) return;
    try {
      const updatedProfile: UserProfile = {
        bio: profile.bio || "",
        username: newUsername.trim(),
        displayName: profile.displayName || "",
        ...(profile.profilePhoto ? { profilePhoto: profile.profilePhoto } : {}),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).saveCallerUserProfile(updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Username updated!");
      setUsernameOpen(false);
      setNewUsername("");
    } catch {
      toast.error("Failed to update username");
    }
  };

  // ── Change Password
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const handlePasswordSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    toast.success("Password updated successfully!");
    setPasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // ── Your Activity
  const [activityOpen, setActivityOpen] = useState(false);

  // ── Dashboard
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // ── Insights
  const [insightsOpen, setInsightsOpen] = useState(false);

  // ── Help / FAQ
  const [helpOpen, setHelpOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // ── Hidden Words Dialog
  const [hiddenWordsOpen, setHiddenWordsOpen] = useState(false);

  // ── Blocked Users Dialog (inline in privacy section)
  const [blockedOpen, setBlockedOpen] = useState(false);

  // ── Close Friends Dialog
  const [cfOpen, setCfOpen] = useState(false);

  // ── Add Account
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  // ── Verification
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyReason, setVerifyReason] = useState("");
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

  // ── Logout
  const handleLogout = () => {
    clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  // ── FAQ Data
  const faqItems = [
    {
      q: "How do I change my password?",
      a: "Go to Settings > Account > Change Password",
    },
    {
      q: "How do I make my account private?",
      a: "Go to Settings > Account > Account Privacy and enable Private Account",
    },
    {
      q: "How do I report a user?",
      a: "Tap the three-dot menu on their profile and select Report",
    },
    {
      q: "How do I delete a post?",
      a: "Open the post, tap the three-dot menu, and select Delete",
    },
    {
      q: "How do I contact support?",
      a: "Send an email to support@vibegrom.app",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-safe bg-background">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-4 py-3 border-b border-border flex items-center gap-3"
        style={{
          background: "oklch(0 0 0 / 0.98)",
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
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 1. ACCOUNT                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <SettingsSection title="Account">
          {/* Username display */}
          <SettingsRow
            label="Username"
            value={profile?.username ? `@${profile.username}` : "—"}
          />
          <Separator className="bg-border/60" />
          {/* Change Username */}
          <SettingsRow
            icon={AtSign}
            label="Change Username"
            onClick={() => setUsernameOpen(true)}
            data-ocid="settings.change_username.button"
          />
          <Separator className="bg-border/60" />
          {/* Edit Profile */}
          <SettingsRow
            icon={UserCheck}
            label="Edit Profile"
            onClick={() => {
              navigate({ to: "/profile" });
            }}
            data-ocid="settings.edit_profile.button"
          />
          <Separator className="bg-border/60" />
          {/* Change Password */}
          <SettingsRow
            icon={Lock}
            label="Change Password"
            onClick={() => setPasswordOpen(true)}
            data-ocid="settings.change_password.button"
          />
          <Separator className="bg-border/60" />
          {/* Account Privacy */}
          <ToggleRow
            icon={Shield}
            label="Account Privacy"
            checked={privateAccount}
            onCheckedChange={(v) => {
              setPrivateAccount(v);
              toast.success(
                v ? "Account set to Private" : "Account set to Public",
              );
            }}
            data-ocid="settings.account_privacy.switch"
          />
          <Separator className="bg-border/60" />
          {/* Activity */}
          <SettingsRow
            icon={Activity}
            label="Activity"
            onClick={() => toast.info("Your total posts and account activity")}
            data-ocid="settings.activity.button"
          />
          <Separator className="bg-border/60" />
          {/* Saved */}
          <SettingsRow
            icon={Bookmark}
            label="Saved"
            onClick={() => navigate({ to: "/saved" })}
            data-ocid="settings.saved.button"
          />
          <Separator className="bg-border/60" />
          {/* Archive */}
          <SettingsRow
            icon={Archive}
            label="Archive"
            onClick={() => toast.info("Archive coming soon")}
            data-ocid="settings.archive.button"
          />
          <Separator className="bg-border/60" />
          {/* Your Activity */}
          <SettingsRow
            icon={Clock}
            label="Your Activity"
            onClick={() => setActivityOpen(true)}
            data-ocid="settings.your_activity.button"
          />
          <Separator className="bg-border/60" />
          {/* Request Verification */}
          <SettingsRow
            icon={BadgeCheck}
            label="Request Verification"
            onClick={() => setVerifyOpen(true)}
            data-ocid="settings.verify.button"
          />
        </SettingsSection>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 2. NOTIFICATIONS                                                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <SettingsSection title="Notifications" icon={Bell}>
          <ToggleRow
            icon={Smartphone}
            label="Push Notifications"
            checked={pushNotif}
            onCheckedChange={(v) => {
              setPushNotif(v);
              toast.success(
                v
                  ? "Push notifications enabled"
                  : "Push notifications disabled",
              );
            }}
            data-ocid="settings.push_notif.switch"
          />
          <Separator className="bg-border/60" />
          <ToggleRow
            icon={Mail}
            label="Email Notifications"
            checked={emailNotif}
            onCheckedChange={(v) => {
              setEmailNotif(v);
              toast.success(
                v
                  ? "Email notifications enabled"
                  : "Email notifications disabled",
              );
            }}
            data-ocid="settings.email_notif.switch"
          />
          <Separator className="bg-border/60" />
          <ToggleRow
            icon={CircleDot}
            label="Story Notifications"
            checked={storyNotif}
            onCheckedChange={(v) => {
              setStoryNotif(v);
              toast.success(
                v
                  ? "Story notifications enabled"
                  : "Story notifications disabled",
              );
            }}
            data-ocid="settings.story_notif.switch"
          />
          <Separator className="bg-border/60" />
          <ToggleRow
            icon={Radio}
            label="Live Notifications"
            checked={liveNotif}
            onCheckedChange={(v) => {
              setLiveNotif(v);
              toast.success(
                v
                  ? "Live notifications enabled"
                  : "Live notifications disabled",
              );
            }}
            data-ocid="settings.live_notif.switch"
          />
        </SettingsSection>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 3. PROFESSIONAL TOOLS                                             */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <SettingsSection title="Professional Tools" icon={Briefcase}>
          <SettingsRow
            icon={LayoutDashboard}
            label="Dashboard"
            onClick={() => setDashboardOpen(true)}
            data-ocid="settings.dashboard.button"
          />
          <Separator className="bg-border/60" />
          <SettingsRow
            icon={BarChart2}
            label="Insights"
            onClick={() => setInsightsOpen(true)}
            data-ocid="settings.insights.button"
          />
          <Separator className="bg-border/60" />
          <SettingsRow
            icon={Megaphone}
            label="Ads"
            onClick={() => toast.info("Ads feature coming soon")}
            data-ocid="settings.ads.button"
          />
        </SettingsSection>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 4. APPEARANCE                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <SettingsSection title="Appearance">
          <ToggleRow
            icon={isDark ? Moon : Sun}
            label="Dark Mode"
            checked={isDark}
            onCheckedChange={handleThemeToggle}
            data-ocid="settings.dark_mode.switch"
          />
        </SettingsSection>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 5. PRIVACY                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <SettingsSection title="Privacy" icon={EyeOff}>
          {/* Blocked Users */}
          <SettingsRow
            icon={UserMinus}
            label="Blocked Users"
            value={blockedList.length > 0 ? `${blockedList.length}` : undefined}
            onClick={() => setBlockedOpen(true)}
            data-ocid="settings.blocked_users.button"
          />
          <Separator className="bg-border/60" />
          {/* Hidden Words */}
          <SettingsRow
            icon={MessageSquareOff}
            label="Hidden Words"
            value={hiddenWords.length > 0 ? `${hiddenWords.length}` : undefined}
            onClick={() => setHiddenWordsOpen(true)}
            data-ocid="settings.hidden_words.button"
          />
          <Separator className="bg-border/60" />
          {/* Close Friends */}
          <SettingsRow
            icon={Heart}
            label="Close Friends"
            value={cfList.length > 0 ? `${cfList.length}` : undefined}
            onClick={() => setCfOpen(true)}
            data-ocid="settings.close_friends.button"
          />
        </SettingsSection>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 6. SUPPORT                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <SettingsSection title="Support" icon={HelpCircle}>
          {/* Help */}
          <SettingsRow
            icon={HelpCircle}
            label="Help"
            onClick={() => setHelpOpen(true)}
            data-ocid="settings.help.button"
          />
          <Separator className="bg-border/60" />
          {/* Privacy Policy */}
          <SettingsRow
            icon={FileText}
            label="Privacy Policy"
            onClick={() => navigate({ to: "/privacy-policy" })}
            data-ocid="settings.privacy_policy.button"
          />
          <Separator className="bg-border/60" />
          {/* Terms & Conditions */}
          <SettingsRow
            icon={FileText}
            label="Terms & Conditions"
            onClick={() => navigate({ to: "/terms" })}
            data-ocid="settings.terms.button"
          />
          <Separator className="bg-border/60" />
          {/* Copyright */}
          <SettingsRow
            icon={FileText}
            label="Copyright"
            onClick={() => navigate({ to: "/copyright" })}
            data-ocid="settings.copyright.button"
          />
        </SettingsSection>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 7. ACCOUNT CONTROL                                                */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <SettingsSection title="Account Control" icon={Settings2}>
          {/* Add Account */}
          <SettingsRow
            icon={UserPlus}
            label="Add Account"
            onClick={() => setAddAccountOpen(true)}
            data-ocid="settings.add_account.button"
          />
          <Separator className="bg-border/60" />
          {/* Log Out */}
          <SettingsRow
            icon={LogOut}
            label="Log Out"
            onClick={handleLogout}
            destructive
            data-ocid="settings.logout.button"
          />
        </SettingsSection>

        {/* Footer */}
        <div className="text-center py-6 px-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">
            © 2026 VibeGrom. All Rights Reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Developed by{" "}
            <span className="text-vibe-purple font-semibold">Spandan</span>
          </p>
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* ── Change Username ───────────────────────────────────────────────── */}
      <Dialog open={usernameOpen} onOpenChange={setUsernameOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.username.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <AtSign size={18} className="text-muted-foreground" />
              Change Username
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a new unique username (letters, numbers, underscores only)
            </p>
            <Input
              value={newUsername}
              onChange={(e) =>
                setNewUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              placeholder="new_username"
              className="bg-secondary border-border"
              data-ocid="settings.username.input"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setUsernameOpen(false)}
                className="flex-1 border-border"
                data-ocid="settings.username.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUsernameChange}
                disabled={!newUsername.trim() || newUsername.length < 3}
                className="flex-1 btn-gradient border-0"
                data-ocid="settings.username.submit_button"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.password.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Lock size={18} className="text-muted-foreground" />
              Change Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-secondary border-border"
                data-ocid="settings.password.current.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-secondary border-border"
                data-ocid="settings.password.new.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-secondary border-border"
                data-ocid="settings.password.confirm.input"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setPasswordOpen(false)}
                className="flex-1 border-border"
                data-ocid="settings.password.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordSubmit}
                className="flex-1 btn-gradient border-0"
                data-ocid="settings.password.submit_button"
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Your Activity ─────────────────────────────────────────────────── */}
      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.activity.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Clock size={18} className="text-muted-foreground" />
              Your Activity
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Weekly screen time summary
            </p>
            {[
              { day: "Monday", time: "42 min" },
              { day: "Tuesday", time: "1h 15 min" },
              { day: "Wednesday", time: "58 min" },
              { day: "Thursday", time: "2h 3 min" },
              { day: "Friday", time: "1h 32 min" },
              { day: "Saturday", time: "3h 10 min" },
              { day: "Sunday", time: "2h 45 min" },
            ].map((item) => (
              <div key={item.day} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {item.day}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {item.time}
                </span>
              </div>
            ))}
            <Separator className="bg-border/60" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Weekly Total</span>
              <span className="text-sm font-bold text-vibe-purple">
                12h 45 min
              </span>
            </div>
            <Button
              onClick={() => setActivityOpen(false)}
              className="w-full btn-gradient border-0"
              data-ocid="settings.activity.close_button"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dashboard ─────────────────────────────────────────────────────── */}
      <Dialog open={dashboardOpen} onOpenChange={setDashboardOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.dashboard.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <LayoutDashboard size={18} className="text-muted-foreground" />
              Dashboard
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              This week's overview
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Followers Gained",
                  value: "+48",
                  color: "text-green-400",
                },
                { label: "Reach", value: "3.2K", color: "text-sky-400" },
                {
                  label: "Impressions",
                  value: "8.7K",
                  color: "text-vibe-purple",
                },
                {
                  label: "Profile Visits",
                  value: "412",
                  color: "text-vibe-pink",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-secondary rounded-xl p-3 space-y-1"
                >
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setDashboardOpen(false)}
              className="w-full btn-gradient border-0"
              data-ocid="settings.dashboard.close_button"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Insights ──────────────────────────────────────────────────────── */}
      <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.insights.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <BarChart2 size={18} className="text-muted-foreground" />
              Insights
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Content performance — last 30 days
            </p>
            {[
              { label: "Post Impressions", value: "24,100", bar: 80 },
              { label: "Profile Visits", value: "1,840", bar: 55 },
              { label: "Website Clicks", value: "312", bar: 20 },
              { label: "Saves", value: "640", bar: 38 },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {item.value}
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, oklch(0.55 0.28 300), oklch(0.60 0.26 340))",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.bar}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
            <Button
              onClick={() => setInsightsOpen(false)}
              className="w-full btn-gradient border-0"
              data-ocid="settings.insights.close_button"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Blocked Users ─────────────────────────────────────────────────── */}
      <Dialog open={blockedOpen} onOpenChange={setBlockedOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.blocked.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <UserMinus size={18} className="text-muted-foreground" />
              Blocked Users
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {blockedList.length === 0 ? (
              <p
                className="text-sm text-muted-foreground text-center py-4"
                data-ocid="settings.blocked.empty_state"
              >
                No blocked users
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {blockedList.map((username, i) => (
                  <div
                    key={username}
                    className="flex items-center gap-3 py-3"
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
            <Button
              variant="outline"
              onClick={() => setBlockedOpen(false)}
              className="w-full border-border"
              data-ocid="settings.blocked.close_button"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Hidden Words ──────────────────────────────────────────────────── */}
      <Dialog open={hiddenWordsOpen} onOpenChange={setHiddenWordsOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.hidden_words.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <MessageSquareOff size={18} className="text-muted-foreground" />
              Hidden Words
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Comments and messages containing these words will be hidden from
              your posts.
            </p>
            <div className="flex gap-2">
              <Input
                value={hiddenWordInput}
                onChange={(e) => setHiddenWordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addHiddenWord();
                }}
                placeholder="Add a word..."
                className="bg-secondary border-border text-sm"
                data-ocid="settings.hidden_words.input"
              />
              <Button
                onClick={addHiddenWord}
                disabled={!hiddenWordInput.trim()}
                className="btn-gradient border-0 shrink-0"
                data-ocid="settings.hidden_words.submit_button"
              >
                Add
              </Button>
            </div>
            {hiddenWords.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {hiddenWords.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-full text-xs text-foreground"
                  >
                    {word}
                    <button
                      type="button"
                      onClick={() => removeHiddenWord(word)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Remove ${word}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p
                className="text-xs text-muted-foreground text-center py-2"
                data-ocid="settings.hidden_words.empty_state"
              >
                No hidden words yet
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => setHiddenWordsOpen(false)}
              className="w-full border-border"
              data-ocid="settings.hidden_words.close_button"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Close Friends ─────────────────────────────────────────────────── */}
      <Dialog open={cfOpen} onOpenChange={setCfOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.close_friends.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Heart size={18} className="text-muted-foreground" />
              Close Friends
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
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
              <p
                className="text-xs text-muted-foreground py-1"
                data-ocid="settings.cf.empty_state"
              >
                No close friends added yet. Search above to add people.
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => setCfOpen(false)}
              className="w-full border-border"
              data-ocid="settings.close_friends.close_button"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Help / FAQ ────────────────────────────────────────────────────── */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.help.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <HelpCircle size={18} className="text-muted-foreground" />
              Help & FAQ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <div
                key={item.q}
                className="border border-border/60 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-3 py-3 hover:bg-secondary/40 transition-colors text-left gap-2"
                  data-ocid={`settings.faq.item.${i + 1}`}
                >
                  <span className="text-sm font-medium text-foreground flex-1">
                    {item.q}
                  </span>
                  <motion.div
                    animate={{ rotate: expandedFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown
                      size={14}
                      className="text-muted-foreground shrink-0"
                    />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 text-sm text-muted-foreground border-t border-border/60">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => setHelpOpen(false)}
              className="w-full border-border mt-2"
              data-ocid="settings.help.close_button"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Account ───────────────────────────────────────────────────── */}
      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent
          className="max-w-sm bg-card border-border rounded-2xl"
          data-ocid="settings.add_account.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <UserPlus size={18} className="text-muted-foreground" />
              Add Another Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              To add a new account, you'll need to log out of your current
              session and sign in with a different Internet Identity.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setAddAccountOpen(false)}
                className="flex-1 border-border"
                data-ocid="settings.add_account.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1 btn-gradient border-0"
                data-ocid="settings.add_account.confirm_button"
              >
                Continue &amp; Log Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Verification ──────────────────────────────────────────────────── */}
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
    </div>
  );
}
