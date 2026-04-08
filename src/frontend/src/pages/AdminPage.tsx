import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  FileText,
  Image,
  IndianRupee,
  Search,
  Shield,
  Trophy,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  AdminAnalytics,
  AdminPostInfo,
  AdminReferralStats,
  AdminUserInfo,
  WithdrawalRequest,
} from "../backend.d";
import { WithdrawalStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";

// ─── Admin Hooks ─────────────────────────────────────────────────────────────

function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

function useAdminAnalytics() {
  const { actor, isFetching } = useActor();
  return useQuery<AdminAnalytics>({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminGetAnalytics();
    },
    enabled: !!actor && !isFetching,
  });
}

function useAdminUsers(search: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AdminUserInfo[]>({
    queryKey: ["adminUsers", search],
    queryFn: async () => {
      if (!actor) return [];
      if (search.trim()) return actor.adminSearchUsers(search.trim());
      return actor.adminGetUsers(BigInt(0), BigInt(50));
    },
    enabled: !!actor && !isFetching,
  });
}

function useAdminPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<AdminPostInfo[]>({
    queryKey: ["adminPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetPosts(BigInt(0), BigInt(50));
    },
    enabled: !!actor && !isFetching,
  });
}

function useAdminFlaggedPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<AdminPostInfo[]>({
    queryKey: ["adminFlaggedPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetFlaggedPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

function useAdminWithdrawals() {
  const { actor, isFetching } = useActor();
  return useQuery<WithdrawalRequest[]>({
    queryKey: ["adminWithdrawals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetWithdrawalRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

function useAdminReferralStats() {
  const { actor, isFetching } = useActor();
  return useQuery<AdminReferralStats>({
    queryKey: ["adminReferralStats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminGetReferralStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-4 border flex flex-col gap-2"
      style={{
        background: "oklch(0.12 0.02 280)",
        borderColor: color,
        boxShadow: `0 0 12px ${color}22`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </span>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="text-2xl font-bold font-display" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab() {
  const { data, isLoading } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {Array.from({ length: 6 }, (_, i) => `dash-skel-${i}`).map((key) => (
          <Skeleton key={key} className="h-20 rounded-xl" />
        ))}{" "}
      </div>
    );
  }

  const stats = [
    {
      label: "Total Users",
      value: Number(data?.totalUsers ?? 0).toLocaleString(),
      icon: <Users size={16} />,
      color: "oklch(0.7 0.25 290)",
    },
    {
      label: "New This Week",
      value: Number(data?.newUsersThisWeek ?? 0).toLocaleString(),
      icon: <UserCheck size={16} />,
      color: "oklch(0.72 0.22 200)",
    },
    {
      label: "Total Posts",
      value: Number(data?.totalPosts ?? 0).toLocaleString(),
      icon: <Image size={16} />,
      color: "oklch(0.75 0.2 340)",
    },
    {
      label: "Total Reels",
      value: Number(data?.totalReels ?? 0).toLocaleString(),
      icon: <FileText size={16} />,
      color: "oklch(0.73 0.24 260)",
    },
    {
      label: "Total Paid",
      value: `₹${(data?.totalWithdrawals ?? 0).toLocaleString()}`,
      icon: <IndianRupee size={16} />,
      color: "oklch(0.78 0.2 150)",
    },
    {
      label: "Pending W/D",
      value: Number(data?.pendingWithdrawals ?? 0).toLocaleString(),
      icon: <AlertTriangle size={16} />,
      color: "oklch(0.75 0.22 60)",
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-base font-semibold text-foreground">Overview</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [confirmUser, setConfirmUser] = useState<AdminUserInfo | null>(null);
  const { data: users = [], isLoading } = useAdminUsers(debouncedSearch);
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const suspendMutation = useMutation({
    mutationFn: async ({
      userId,
      suspend,
    }: {
      userId: AdminUserInfo["userId"];
      suspend: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (suspend) return actor.adminSuspendUser(userId);
      return actor.adminUnsuspendUser(userId);
    },
    onSuccess: (_data, { suspend }) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success(suspend ? "User suspended" : "User unsuspended");
      setConfirmUser(null);
    },
    onError: () => toast.error("Action failed"),
  });

  function handleSearch(val: string) {
    setSearch(val);
    clearTimeout((handleSearch as { t?: ReturnType<typeof setTimeout> }).t);
    (handleSearch as { t?: ReturnType<typeof setTimeout> }).t = setTimeout(
      () => setDebouncedSearch(val),
      400,
    );
  }

  function formatDate(ts: bigint) {
    return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-4 space-y-3">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users..."
          className="pl-8 bg-card border-border text-sm"
          data-ocid="admin-user-search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {["u1", "u2", "u3", "u4", "u5"].map((k) => (
            <Skeleton key={k} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">
          No users found
        </p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.userId.toString()}
              className="flex items-center gap-3 rounded-xl p-3 border border-border bg-card"
              data-ocid="admin-user-row"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.6 0.25 290), oklch(0.65 0.27 340))",
                }}
              >
                {user.username[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate">
                    @{user.username}
                  </span>
                  {user.isSuspended && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] px-1.5 py-0"
                    >
                      Suspended
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {user.displayName}
                </p>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {Number(user.postCount)} posts
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {Number(user.followerCount)} followers
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(user.joinedAt)}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant={user.isSuspended ? "outline" : "destructive"}
                className="text-xs shrink-0 h-7 px-2"
                onClick={() => setConfirmUser(user)}
                data-ocid="admin-suspend-btn"
              >
                {user.isSuspended ? "Unsuspend" : "Suspend"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog
        open={!!confirmUser}
        onOpenChange={(open) => !open && setConfirmUser(null)}
      >
        <DialogContent className="bg-card border-border max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {confirmUser?.isSuspended ? "Unsuspend" : "Suspend"} User
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmUser?.isSuspended
              ? `Restore access for @${confirmUser?.username}?`
              : `Suspend @${confirmUser?.username}? They won't be able to post or interact.`}
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmUser(null)}
            >
              Cancel
            </Button>
            <Button
              variant={confirmUser?.isSuspended ? "default" : "destructive"}
              size="sm"
              disabled={suspendMutation.isPending}
              onClick={() => {
                if (confirmUser)
                  suspendMutation.mutate({
                    userId: confirmUser.userId,
                    suspend: !confirmUser.isSuspended,
                  });
              }}
              data-ocid="admin-suspend-confirm"
            >
              {suspendMutation.isPending
                ? "Processing..."
                : confirmUser?.isSuspended
                  ? "Unsuspend"
                  : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Posts Tab ────────────────────────────────────────────────────────────────

function PostsTab() {
  const [subTab, setSubTab] = useState<"all" | "flagged">("all");
  const [confirmPost, setConfirmPost] = useState<AdminPostInfo | null>(null);
  const { data: allPosts = [], isLoading: allLoading } = useAdminPosts();
  const { data: flaggedPosts = [], isLoading: flaggedLoading } =
    useAdminFlaggedPosts();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: async (postId: AdminPostInfo["id"]) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminRemovePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      queryClient.invalidateQueries({ queryKey: ["adminFlaggedPosts"] });
      toast.success("Post removed");
      setConfirmPost(null);
    },
    onError: () => toast.error("Failed to remove post"),
  });

  const posts = subTab === "all" ? allPosts : flaggedPosts;
  const isLoading = subTab === "all" ? allLoading : flaggedLoading;

  function formatDate(ts: bigint) {
    return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div className="p-4 space-y-3">
      {/* Sub-tabs */}
      <div className="flex rounded-lg overflow-hidden border border-border">
        {(["all", "flagged"] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setSubTab(t)}
            className="flex-1 py-2 text-xs font-medium capitalize transition-colors"
            style={{
              background: subTab === t ? "oklch(0.6 0.25 290)" : "transparent",
              color: subTab === t ? "oklch(0.98 0 0)" : "oklch(0.65 0.01 270)",
            }}
            data-ocid={`admin-posts-subtab-${t}`}
          >
            {t === "flagged"
              ? `Flagged (${flaggedPosts.length})`
              : `All Posts (${allPosts.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {["p1", "p2", "p3", "p4"].map((k) => (
            <Skeleton key={k} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">
          No posts found
        </p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id.toString()}
              className="flex items-center gap-3 rounded-xl p-3 border border-border bg-card"
              data-ocid="admin-post-row"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.18 0.02 280)" }}
              >
                <Image size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-foreground truncate">
                    @{post.authorId.toString().slice(0, 10)}...
                  </span>
                  {post.isFlagged && (
                    <Badge
                      className="text-[10px] px-1.5 py-0"
                      style={{
                        background: "oklch(0.65 0.22 60)",
                        color: "oklch(0.1 0 0)",
                      }}
                    >
                      Flagged
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {post.caption || "(no caption)"}
                </p>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    ❤️ {Number(post.likeCount)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    💬 {Number(post.commentCount)}
                  </span>
                  {post.isFlagged && (
                    <span className="text-[10px] text-orange-400">
                      🚩 {Number(post.flagCount)} flags
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="text-xs shrink-0 h-7 px-2"
                onClick={() => setConfirmPost(post)}
                data-ocid="admin-remove-post-btn"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!confirmPost}
        onOpenChange={(open) => !open && setConfirmPost(null)}
      >
        <DialogContent className="bg-card border-border max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Remove Post</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Permanently remove this post? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmPost(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={removeMutation.isPending}
              onClick={() => {
                if (confirmPost) removeMutation.mutate(confirmPost.id);
              }}
              data-ocid="admin-remove-post-confirm"
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Withdrawals Tab ──────────────────────────────────────────────────────────

function WithdrawalsTab() {
  const { data: requests = [], isLoading } = useAdminWithdrawals();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<WithdrawalRequest | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useMutation({
    mutationFn: async (txId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminApproveWithdrawal(txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["adminAnalytics"] });
      toast.success("Withdrawal approved");
    },
    onError: () => toast.error("Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ txId, reason }: { txId: bigint; reason: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminRejectWithdrawal(txId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      toast.success("Withdrawal rejected");
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: () => toast.error("Failed to reject"),
  });

  function formatDate(ts: bigint) {
    return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function statusBadge(status: string) {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: "Pending", color: "oklch(0.75 0.22 60)" },
      approved: { label: "Approved", color: "oklch(0.72 0.2 150)" },
      rejected: { label: "Rejected", color: "oklch(0.6 0.25 25)" },
    };
    const s = map[status] ?? map.pending;
    return (
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
        style={{
          background: `${s.color}22`,
          color: s.color,
          border: `1px solid ${s.color}55`,
        }}
      >
        {s.label}
      </span>
    );
  }

  const pending = requests.filter((r) => r.status === WithdrawalStatus.pending);
  const processed = requests.filter(
    (r) => r.status !== WithdrawalStatus.pending,
  );

  return (
    <div className="p-4 space-y-4">
      {isLoading ? (
        <div className="space-y-3">
          {["w1", "w2", "w3", "w4"].map((k) => (
            <Skeleton key={k} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pending ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                No pending withdrawals
              </p>
            ) : (
              pending.map((req) => (
                <div
                  key={req.id.toString()}
                  className="rounded-xl p-3 border border-border bg-card space-y-2"
                  data-ocid="admin-withdrawal-row"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        ₹{req.amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        via {req.method}
                      </span>
                    </div>
                    {statusBadge(req.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span>{req.accountDetails}</span>
                    <span className="mx-2">·</span>
                    <span>{formatDate(req.createdAt)}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      style={{
                        background: "oklch(0.55 0.2 150)",
                        color: "oklch(0.98 0 0)",
                      }}
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(req.id)}
                      data-ocid="admin-approve-btn"
                    >
                      <Check size={12} className="mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 h-7 text-xs"
                      onClick={() => setRejectTarget(req)}
                      data-ocid="admin-reject-btn"
                    >
                      <X size={12} className="mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {processed.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                History ({processed.length})
              </h3>
              {processed.map((req) => (
                <div
                  key={req.id.toString()}
                  className="rounded-xl p-3 border border-border bg-card"
                  data-ocid="admin-withdrawal-history-row"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        ₹{req.amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        via {req.method}
                      </span>
                    </div>
                    {statusBadge(req.status)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {req.accountDetails} · {formatDate(req.createdAt)}
                  </div>
                  {req.rejectionReason && (
                    <p className="text-xs text-red-400 mt-1">
                      Reason: {req.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Reject dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="bg-card border-border max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Reject Withdrawal
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Rejecting ₹{rejectTarget?.amount.toLocaleString()} request.
          </p>
          <Input
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="bg-background border-border text-sm"
            data-ocid="admin-reject-reason-input"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              onClick={() => {
                if (rejectTarget)
                  rejectMutation.mutate({
                    txId: rejectTarget.id,
                    reason: rejectReason,
                  });
              }}
              data-ocid="admin-reject-confirm"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Referrals Tab ────────────────────────────────────────────────────────────

function ReferralsTab() {
  const { data, isLoading } = useAdminReferralStats();

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Referrals"
          value={Number(data?.totalReferrals ?? 0).toLocaleString()}
          icon={<Users size={16} />}
          color="oklch(0.7 0.25 290)"
        />
        <StatCard
          label="Total Paid Out"
          value={`₹${(data?.totalPaid ?? 0).toLocaleString()}`}
          icon={<IndianRupee size={16} />}
          color="oklch(0.72 0.2 150)"
        />
        <StatCard
          label="Pending Payout"
          value={`₹${(data?.pendingPayout ?? 0).toLocaleString()}`}
          icon={<AlertTriangle size={16} />}
          color="oklch(0.75 0.22 60)"
        />
      </div>

      {/* Top Referrers */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <Trophy size={14} style={{ color: "oklch(0.75 0.22 60)" }} />
          Top Referrers
        </h3>
        {!data?.topReferrers?.length ? (
          <p className="text-center text-muted-foreground text-sm py-6">
            No referral data yet
          </p>
        ) : (
          <div className="rounded-xl overflow-hidden border border-border">
            <div
              className="grid grid-cols-[32px_1fr_80px_80px] px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide"
              style={{ background: "oklch(0.14 0.02 280)" }}
            >
              <span>#</span>
              <span>User</span>
              <span className="text-right">Referrals</span>
              <span className="text-right">Earned</span>
            </div>
            {data.topReferrers.map((r, i) => (
              <div
                key={r.username}
                className="grid grid-cols-[32px_1fr_80px_80px] px-3 py-2.5 border-t border-border items-center bg-card"
                data-ocid="admin-referrer-row"
              >
                <span
                  className="text-xs font-bold"
                  style={{
                    color:
                      i === 0
                        ? "oklch(0.8 0.2 60)"
                        : i === 1
                          ? "oklch(0.75 0.02 270)"
                          : i === 2
                            ? "oklch(0.65 0.18 40)"
                            : "oklch(0.65 0.01 270)",
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-foreground truncate">
                  @{r.username}
                </span>
                <span className="text-xs text-right text-muted-foreground">
                  {Number(r.earnings > 0 ? "—" : 0)}
                </span>
                <span
                  className="text-xs text-right font-semibold"
                  style={{ color: "oklch(0.72 0.2 150)" }}
                >
                  ₹{r.earnings.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab Config ───────────────────────────────────────────────────────────────

type AdminTab = "dashboard" | "users" | "posts" | "withdrawals" | "referrals";

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={14} /> },
  { id: "users", label: "Users", icon: <Users size={14} /> },
  { id: "posts", label: "Posts", icon: <Image size={14} /> },
  { id: "withdrawals", label: "Withdrawals", icon: <IndianRupee size={14} /> },
  { id: "referrals", label: "Referrals", icon: <Trophy size={14} /> },
];

// ─── Admin Page ───────────────────────────────────────────────────────────────

export function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  // Access denied
  if (!adminLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.2 0.08 25)" }}
        >
          <Shield size={36} style={{ color: "oklch(0.65 0.25 25)" }} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-sm text-muted-foreground">
            You don't have permission to access the admin panel.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/" })}
          data-ocid="admin-access-denied-back"
        >
          <ArrowLeft size={14} className="mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Skeleton className="w-16 h-16 rounded-full mx-auto" />
          <Skeleton className="w-32 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b border-border"
        style={{ background: "oklch(0.1 0.02 280)" }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="admin-header-back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Shield size={18} style={{ color: "oklch(0.7 0.25 290)" }} />
          <h1
            className="text-base font-bold font-display"
            style={{ color: "oklch(0.7 0.25 290)" }}
          >
            Admin Panel
          </h1>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: "oklch(0.6 0.25 290)22",
            color: "oklch(0.7 0.25 290)",
            border: "1px solid oklch(0.6 0.25 290)55",
          }}
        >
          BUTKI
        </span>
      </div>

      {/* Tabs */}
      <div
        className="sticky top-[53px] z-10 border-b border-border overflow-x-auto"
        style={{ background: "oklch(0.1 0.02 280)" }}
      >
        <div className="flex min-w-max px-2 py-2 gap-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: active ? "oklch(0.6 0.25 290)" : "transparent",
                  color: active ? "oklch(0.98 0 0)" : "oklch(0.6 0.01 270)",
                  boxShadow: active
                    ? "0 0 10px oklch(0.6 0.25 290 / 0.4)"
                    : "none",
                }}
                data-ocid={`admin-tab-${tab.id}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "posts" && <PostsTab />}
        {activeTab === "withdrawals" && <WithdrawalsTab />}
        {activeTab === "referrals" && <ReferralsTab />}
      </div>
    </div>
  );
}
