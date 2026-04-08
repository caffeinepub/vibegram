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
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flag,
  Gift,
  Image,
  IndianRupee,
  Medal,
  Moon,
  MoreVertical,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sun,
  TrendingUp,
  Trophy,
  UserCheck,
  UserX,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import {
  appendAuditLog,
  useAdminAuditLog,
  useAdminFraudScores,
  useAdminGetAnalytics,
  useAdminGetFlaggedPosts,
  useAdminGetPosts,
  useAdminGetReferralStats,
  useAdminGetUsers,
  useAdminGetWithdrawalRequests,
  useAdminRemovePost,
  useAdminRewards,
  useAdminSearchUsers,
  useAdminSetAdmin,
  useAdminSetRewards,
  useAdminSuspendUser,
  useAdminUnsuspendUser,
} from "../hooks/useQueries";

// ─── Local isCallerAdmin hook ─────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(ts: bigint) {
  const diff = Date.now() - Number(ts) / 1_000_000;
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "just now";
}

function avatarInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

// ─── Theme Context ────────────────────────────────────────────────────────────

type AdminTheme = "dark" | "light";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusPill({ status, label }: { status: string; label?: string }) {
  const MAP: Record<string, { bg: string; text: string; border: string }> = {
    pending: {
      bg: "oklch(0.72 0.22 50 / 0.15)",
      text: "oklch(0.72 0.22 50)",
      border: "oklch(0.72 0.22 50 / 0.4)",
    },
    approved: {
      bg: "oklch(0.65 0.22 130 / 0.15)",
      text: "oklch(0.65 0.22 130)",
      border: "oklch(0.65 0.22 130 / 0.4)",
    },
    rejected: {
      bg: "oklch(0.6 0.24 25 / 0.15)",
      text: "oklch(0.6 0.24 25)",
      border: "oklch(0.6 0.24 25 / 0.4)",
    },
    flagged: {
      bg: "oklch(0.65 0.25 30 / 0.15)",
      text: "oklch(0.7 0.22 40)",
      border: "oklch(0.65 0.25 30 / 0.4)",
    },
    active: {
      bg: "oklch(0.65 0.22 150 / 0.15)",
      text: "oklch(0.65 0.22 150)",
      border: "oklch(0.65 0.22 150 / 0.4)",
    },
    suspended: {
      bg: "oklch(0.6 0.24 25 / 0.15)",
      text: "oklch(0.65 0.2 25)",
      border: "oklch(0.6 0.24 25 / 0.4)",
    },
  };
  const s = MAP[status] ?? MAP.pending;
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
      }}
    >
      {label ?? status}
    </span>
  );
}

// ─── Fraud Risk Dot ───────────────────────────────────────────────────────────

function RiskBadge({ score }: { score: number }) {
  const color =
    score > 70
      ? "oklch(0.6 0.24 25)"
      : score > 30
        ? "oklch(0.78 0.2 60)"
        : "oklch(0.65 0.22 150)";
  const label = score > 70 ? "High" : score > 30 ? "Med" : "Low";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{
        background: `${color}20`,
        color,
        border: `1px solid ${color}50`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {label} {score}
    </span>
  );
}

// ─── Action Badge (Audit Log) ─────────────────────────────────────────────────

const ACTION_STYLE: Record<string, { bg: string; text: string }> = {
  SUSPEND_USER: {
    bg: "oklch(0.6 0.24 25 / 0.15)",
    text: "oklch(0.65 0.24 25)",
  },
  UNSUSPEND_USER: {
    bg: "oklch(0.65 0.22 150 / 0.15)",
    text: "oklch(0.65 0.22 150)",
  },
  REMOVE_POST: { bg: "oklch(0.7 0.22 50 / 0.15)", text: "oklch(0.72 0.22 50)" },
  APPROVE_WITHDRAWAL: {
    bg: "oklch(0.65 0.22 130 / 0.15)",
    text: "oklch(0.65 0.22 130)",
  },
  REJECT_WITHDRAWAL: {
    bg: "oklch(0.6 0.24 25 / 0.15)",
    text: "oklch(0.6 0.24 25)",
  },
  SET_REWARDS: {
    bg: "oklch(0.62 0.22 295 / 0.15)",
    text: "oklch(0.72 0.24 295)",
  },
  MAKE_ADMIN: {
    bg: "oklch(0.62 0.22 295 / 0.15)",
    text: "oklch(0.72 0.24 295)",
  },
};

function ActionBadge({ action }: { action: string }) {
  const s = ACTION_STYLE[action] ?? {
    bg: "oklch(0.2 0.01 280)",
    text: "oklch(0.6 0.01 270)",
  };
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.text }}
    >
      {action}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function UserAvatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white shrink-0 select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.33,
        background:
          "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
      }}
    >
      {avatarInitials(name)}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor: string;
  sub?: string;
  trend?: number;
}

function KpiCard({
  label,
  value,
  icon,
  accentColor,
  sub,
  trend,
}: KpiCardProps) {
  return (
    <div
      className="rounded-2xl p-4 border flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-default select-none"
      style={{
        background: "oklch(0.09 0.006 270)",
        borderColor: `${accentColor}40`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 0 20px ${accentColor}33`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}20`, color: accentColor }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className="text-[10px] font-semibold flex items-center gap-0.5"
            style={{
              color: trend >= 0 ? "oklch(0.65 0.22 130)" : "oklch(0.6 0.24 25)",
            }}
          >
            <TrendingUp size={10} />
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <div>
        <div
          className="text-2xl font-bold font-display tracking-tight"
          style={{ color: accentColor }}
        >
          {value}
        </div>
        <div className="text-xs text-muted-foreground font-medium mt-0.5">
          {label}
        </div>
        {sub && (
          <div className="text-[10px] text-muted-foreground/70 mt-0.5">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
}: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-bold text-foreground font-display">
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────

function ChartCard({
  children,
  title,
  subtitle,
}: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "oklch(0.09 0.006 270)",
        borderColor: "oklch(0.22 0.015 280)",
      }}
    >
      <SectionHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs border shadow-xl"
      style={{
        background: "oklch(0.12 0.01 270)",
        borderColor: "oklch(0.25 0.02 280)",
        color: "oklch(0.9 0.01 280)",
      }}
    >
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Sub-tab toggle ───────────────────────────────────────────────────────────

function SubTabBar<T extends string>({
  tabs,
  active,
  onChange,
}: { tabs: { id: T; label: string }[]; active: T; onChange: (t: T) => void }) {
  return (
    <div
      className="flex rounded-xl overflow-hidden border p-1 gap-1"
      style={{
        background: "oklch(0.09 0.006 270)",
        borderColor: "oklch(0.2 0.01 280)",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all"
          style={
            active === t.id
              ? {
                  background: "oklch(0.62 0.22 295)",
                  color: "#fff",
                  boxShadow: "0 0 12px oklch(0.62 0.22 295 / 0.4)",
                }
              : { color: "oklch(0.55 0.01 270)" }
          }
          data-ocid={`admin-subtab-${t.id}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

type AdminTab =
  | "dashboard"
  | "users"
  | "posts"
  | "withdrawals"
  | "referrals"
  | "rewards"
  | "audit";

function DashboardTab({
  onSwitchTab,
  allUsers,
}: { onSwitchTab: (tab: AdminTab) => void; allUsers: AdminUserInfo[] }) {
  const { data, isLoading } = useAdminGetAnalytics();
  const { data: withdrawals = [] } = useAdminGetWithdrawalRequests();
  const { data: flaggedPosts = [] } = useAdminGetFlaggedPosts();
  const { data: fraudScores = [] } = useAdminFraudScores(allUsers);

  const pendingWd = withdrawals.filter(
    (r) => r.status === WithdrawalStatus.pending,
  );
  const pendingWdAmount = pendingWd.reduce((s, r) => s + r.amount, 0);
  const highRiskCount = fraudScores.filter((f) => f.riskScore > 70).length;

  const totalUsers = Number(data?.totalUsers ?? 0);
  const weeklyData = [
    { day: "Mon", users: Math.max(0, totalUsers - 42) },
    { day: "Tue", users: Math.max(0, totalUsers - 36) },
    { day: "Wed", users: Math.max(0, totalUsers - 28) },
    { day: "Thu", users: Math.max(0, totalUsers - 20) },
    { day: "Fri", users: Math.max(0, totalUsers - 15) },
    { day: "Sat", users: Math.max(0, totalUsers - 8) },
    { day: "Sun", users: totalUsers },
  ];

  const earningsData = [
    {
      name: "Signup",
      amount: 10 * Number(data?.newUsersThisWeek ?? 0),
      fill: "oklch(0.65 0.25 350)",
    },
    {
      name: "Reel",
      amount: 20 * Number(data?.totalReels ?? 0) * 0.1,
      fill: "oklch(0.62 0.22 295)",
    },
    {
      name: "Follower",
      amount: 50 * Number(data?.totalUsers ?? 0) * 0.05,
      fill: "oklch(0.6 0.2 225)",
    },
  ];

  const kpis: KpiCardProps[] = [
    {
      label: "Total Users",
      value: Number(data?.totalUsers ?? 0).toLocaleString(),
      icon: <Users size={16} />,
      accentColor: "oklch(0.72 0.24 295)",
      trend: 12,
    },
    {
      label: "New This Week",
      value: Number(data?.newUsersThisWeek ?? 0).toLocaleString(),
      icon: <UserCheck size={16} />,
      accentColor: "oklch(0.68 0.22 200)",
      sub: "user signups",
    },
    {
      label: "Total Posts",
      value: Number(data?.totalPosts ?? 0).toLocaleString(),
      icon: <Image size={16} />,
      accentColor: "oklch(0.72 0.25 340)",
      trend: 8,
    },
    {
      label: "Total Reels",
      value: Number(data?.totalReels ?? 0).toLocaleString(),
      icon: <Zap size={16} />,
      accentColor: "oklch(0.7 0.24 260)",
    },
    {
      label: "Total Paid Out",
      value: `₹${(data?.totalWithdrawals ?? 0).toLocaleString()}`,
      icon: <IndianRupee size={16} />,
      accentColor: "oklch(0.68 0.2 150)",
    },
    {
      label: "Pending Payouts",
      value: pendingWd.length,
      icon: <AlertTriangle size={16} />,
      accentColor: "oklch(0.72 0.22 60)",
      sub: `₹${pendingWdAmount.toLocaleString()} pending`,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }, (_, i) => `sk-${i}`).map((k) => (
            <Skeleton key={k} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Fraud Alert */}
      {highRiskCount > 0 && (
        <button
          type="button"
          onClick={() => onSwitchTab("users")}
          className="w-full rounded-2xl border p-4 flex items-center gap-3 text-left transition-all hover:scale-[1.01]"
          style={{
            background: "oklch(0.6 0.24 25 / 0.08)",
            borderColor: "oklch(0.6 0.24 25 / 0.4)",
          }}
          data-ocid="admin-fraud-alert-card"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "oklch(0.6 0.24 25 / 0.2)",
              color: "oklch(0.7 0.24 25)",
            }}
          >
            <AlertTriangle size={16} />
          </div>
          <div className="flex-1">
            <p
              className="text-sm font-bold"
              style={{ color: "oklch(0.75 0.24 25)" }}
            >
              {highRiskCount} High-Risk Account{highRiskCount > 1 ? "s" : ""}{" "}
              Detected
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Tap to review users with risk score &gt; 70
            </p>
          </div>
        </button>
      )}

      {/* KPI Cards */}
      <div>
        <SectionHeader title="Overview" subtitle="Platform-wide stats" />
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>
      </div>

      {/* User Growth */}
      <ChartCard title="User Growth" subtitle="Last 7 days">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={weeklyData}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.2 0.01 280)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: "oklch(0.55 0.01 270)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "oklch(0.55 0.01 270)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="users"
              name="Users"
              stroke="oklch(0.72 0.24 295)"
              strokeWidth={2.5}
              dot={{ fill: "oklch(0.72 0.24 295)", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "oklch(0.72 0.24 295)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Referral Earnings */}
      <ChartCard title="Referral Earnings" subtitle="By reward type (₹)">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={earningsData}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.2 0.01 280)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "oklch(0.55 0.01 270)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "oklch(0.55 0.01 270)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" name="₹ Paid" radius={[6, 6, 0, 0]}>
              {earningsData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3">
          {earningsData.map((e) => (
            <div key={e.name} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: e.fill }}
              />
              <span className="text-[10px] text-muted-foreground">
                {e.name}
              </span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Quick Actions */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSwitchTab("posts")}
            className="rounded-2xl p-4 border flex flex-col gap-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "oklch(0.65 0.25 30 / 0.08)",
              borderColor: "oklch(0.65 0.25 30 / 0.35)",
            }}
            data-ocid="admin-quick-flagged"
          >
            <div className="flex items-center justify-between">
              <Flag size={18} style={{ color: "oklch(0.7 0.22 40)" }} />
              {flaggedPosts.length > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "oklch(0.65 0.25 30)", color: "#fff" }}
                >
                  {flaggedPosts.length}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Flagged Posts
              </p>
              <p className="text-[10px] text-muted-foreground">
                Review reported content
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSwitchTab("withdrawals")}
            className="rounded-2xl p-4 border flex flex-col gap-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "oklch(0.72 0.22 50 / 0.08)",
              borderColor: "oklch(0.72 0.22 50 / 0.35)",
            }}
            data-ocid="admin-quick-withdrawals"
          >
            <div className="flex items-center justify-between">
              <IndianRupee size={18} style={{ color: "oklch(0.72 0.22 50)" }} />
              {pendingWd.length > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "oklch(0.72 0.22 50)", color: "#000" }}
                >
                  {pendingWd.length}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Pending Payouts
              </p>
              <p className="text-[10px] text-muted-foreground">
                ₹{pendingWdAmount.toLocaleString()} waiting
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Content Mix */}
      {Number(data?.totalPosts ?? 0) > 0 && (
        <ChartCard title="Content Mix" subtitle="Posts vs Reels">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Posts",
                      value:
                        Number(data?.totalPosts ?? 0) -
                        Number(data?.totalReels ?? 0),
                    },
                    { name: "Reels", value: Number(data?.totalReels ?? 0) },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={44}
                  dataKey="value"
                  paddingAngle={3}
                >
                  <Cell fill="oklch(0.62 0.22 295)" />
                  <Cell fill="oklch(0.65 0.25 350)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "oklch(0.62 0.22 295)" }}
                />
                <span className="text-xs text-muted-foreground">
                  Photos:{" "}
                  {(
                    Number(data?.totalPosts ?? 0) -
                    Number(data?.totalReels ?? 0)
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "oklch(0.65 0.25 350)" }}
                />
                <span className="text-xs text-muted-foreground">
                  Reels: {Number(data?.totalReels ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </ChartCard>
      )}
    </div>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserDetailModal({
  user,
  fraudScore,
  onClose,
}: {
  user: AdminUserInfo;
  fraudScore: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const suspendMutation = useAdminSuspendUser();
  const unsuspendMutation = useAdminUnsuspendUser();
  const makeAdminMutation = useAdminSetAdmin();

  const handleSuspend = () => {
    if (user.isSuspended) {
      unsuspendMutation.mutate(user.userId, {
        onSuccess: () => {
          appendAuditLog({
            adminId: "admin",
            action: "UNSUSPEND_USER",
            target: `@${user.username}`,
            details: `Unsuspended user ${user.userId.toString().slice(0, 8)}`,
          });
          toast.success(`User @${user.username} unsuspended`);
          queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
          onClose();
        },
      });
    } else {
      suspendMutation.mutate(user.userId, {
        onSuccess: () => {
          appendAuditLog({
            adminId: "admin",
            action: "SUSPEND_USER",
            target: `@${user.username}`,
            details: `Suspended user ${user.userId.toString().slice(0, 8)}`,
          });
          toast.success(`User @${user.username} suspended`);
          queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
          onClose();
        },
      });
    }
  };

  const handleMakeAdmin = () => {
    makeAdminMutation.mutate(user.userId, {
      onSuccess: () => {
        appendAuditLog({
          adminId: "admin",
          action: "MAKE_ADMIN",
          target: `@${user.username}`,
          details: "Granted admin role",
        });
        toast.success(`@${user.username} is now an admin`);
        onClose();
      },
    });
  };

  const isPending = suspendMutation.isPending || unsuspendMutation.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <UserAvatar name={user.username} size={32} />
            <span>@{user.username}</span>
            <RiskBadge score={fraudScore} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Display Name", value: user.displayName },
              { label: "Joined", value: formatDate(user.joinedAt) },
              {
                label: "Posts",
                value: Number(user.postCount).toLocaleString(),
              },
              {
                label: "Followers",
                value: Number(user.followerCount).toLocaleString(),
              },
              {
                label: "Status",
                value: user.isSuspended ? "Suspended" : "Active",
              },
              { label: "Fraud Score", value: `${fraudScore}/100` },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-3 border"
                style={{
                  background: "oklch(0.08 0.005 270)",
                  borderColor: "oklch(0.2 0.01 280)",
                }}
              >
                <p className="text-[10px] text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {fraudScore > 30 && (
            <div
              className="rounded-xl border p-3 space-y-1"
              style={{
                background: "oklch(0.6 0.24 25 / 0.06)",
                borderColor: "oklch(0.6 0.24 25 / 0.3)",
              }}
            >
              <p
                className="text-[10px] font-bold"
                style={{ color: "oklch(0.7 0.24 25)" }}
              >
                Fraud Indicators
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {[
                  Number(user.postCount) === 0 && "Zero posts",
                  Number(user.followerCount) === 0 && "No followers",
                  user.isSuspended && "Previously suspended",
                ]
                  .filter(Boolean)
                  .map((flag) => (
                    <span
                      key={String(flag)}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: "oklch(0.6 0.24 25 / 0.15)",
                        color: "oklch(0.7 0.22 30)",
                      }}
                    >
                      {String(flag)}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex gap-2 w-full">
            <Button
              variant={user.isSuspended ? "default" : "destructive"}
              size="sm"
              className="flex-1"
              disabled={isPending}
              onClick={handleSuspend}
              data-ocid="user-detail-suspend-btn"
            >
              {isPending ? (
                "Processing..."
              ) : user.isSuspended ? (
                <>
                  <UserCheck size={13} className="mr-1" />
                  Unsuspend
                </>
              ) : (
                <>
                  <UserX size={13} className="mr-1" />
                  Suspend
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={makeAdminMutation.isPending}
              onClick={handleMakeAdmin}
              data-ocid="user-detail-make-admin-btn"
            >
              <Shield size={13} className="mr-1" />
              Make Admin
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

type UserFilter = "all" | "active" | "suspended";

function UsersTab() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUserInfo | null>(null);
  const PAGE_SIZE = 10;
  const timerRef = {
    t: undefined as ReturnType<typeof setTimeout> | undefined,
  };

  const { data: allUsers = [], isLoading } =
    useAdminSearchUsers(debouncedSearch);
  const { data: fraudScores = [] } = useAdminFraudScores(allUsers);

  function getFraudScore(userId: string) {
    return fraudScores.find((f) => f.userId === userId)?.riskScore ?? 0;
  }

  function handleSearch(val: string) {
    setSearch(val);
    clearTimeout(timerRef.t);
    timerRef.t = setTimeout(() => setDebouncedSearch(val), 400);
    setPage(0);
  }

  const filtered = allUsers.filter((u) => {
    if (filter === "active") return u.isActive && !u.isSuspended;
    if (filter === "suspended") return u.isSuspended;
    return true;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="space-y-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-8 bg-card/80 border-border/60 text-sm h-10"
            data-ocid="admin-user-search"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {(["all", "active", "suspended"] as UserFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setPage(0);
              }}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all"
              style={
                filter === f
                  ? { background: "oklch(0.62 0.22 295)", color: "#fff" }
                  : {
                      background: "oklch(0.13 0.006 270)",
                      color: "oklch(0.6 0.01 270)",
                      border: "1px solid oklch(0.22 0.01 280)",
                    }
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="flex-shrink-0 text-xs text-muted-foreground self-center ml-1">
            {filtered.length} users
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => `us-${i}`).map((k) => (
            <Skeleton key={k} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Users size={32} className="text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((user) => {
            const score = getFraudScore(user.userId.toString());
            return (
              <button
                key={user.userId.toString()}
                type="button"
                onClick={() => setSelectedUser(user)}
                className="w-full flex items-center gap-3 rounded-2xl p-3 border border-border/60 bg-card/80 transition-all hover:bg-card text-left"
                data-ocid="admin-user-row"
              >
                <UserAvatar name={user.username} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      @{user.username}
                    </span>
                    <StatusPill
                      status={user.isSuspended ? "suspended" : "active"}
                      label={user.isSuspended ? "Suspended" : "Active"}
                    />
                    <RiskBadge score={score} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.displayName}
                  </p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {Number(user.postCount)} posts
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      ·
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {Number(user.followerCount)} followers
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      ·
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(user.joinedAt)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-40 hover:text-foreground transition-colors"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-40 hover:text-foreground transition-colors"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          fraudScore={getFraudScore(selectedUser.userId.toString())}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

// ─── Posts Tab ────────────────────────────────────────────────────────────────

function PostsTab() {
  const [subTab, setSubTab] = useState<"all" | "flagged">("all");
  const [confirmPost, setConfirmPost] = useState<AdminPostInfo | null>(null);
  const { data: allPosts = [], isLoading: allLoading } = useAdminGetPosts(
    0,
    50,
  );
  const { data: flaggedPosts = [], isLoading: flaggedLoading } =
    useAdminGetFlaggedPosts();
  const removeMutation = useAdminRemovePost();

  const posts = subTab === "all" ? allPosts : flaggedPosts;
  const isLoading = subTab === "all" ? allLoading : flaggedLoading;

  return (
    <div className="p-4 space-y-3 pb-8">
      <SubTabBar
        tabs={[
          { id: "all" as const, label: `All Posts (${allPosts.length})` },
          {
            id: "flagged" as const,
            label: `🚩 Flagged (${flaggedPosts.length})`,
          },
        ]}
        active={subTab}
        onChange={setSubTab}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }, (_, i) => `ps-${i}`).map((k) => (
            <Skeleton key={k} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <Image size={32} className="text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            {subTab === "flagged"
              ? "No flagged posts — all clear!"
              : "No posts found"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {posts.map((post) => (
            <div
              key={post.id.toString()}
              className="rounded-2xl border overflow-hidden flex flex-col"
              style={{
                background: "oklch(0.09 0.006 270)",
                borderColor: post.isFlagged
                  ? "oklch(0.65 0.25 30 / 0.5)"
                  : "oklch(0.2 0.01 280)",
              }}
              data-ocid="admin-post-card"
            >
              <div
                className="h-24 flex items-center justify-center relative"
                style={{
                  background: post.isFlagged
                    ? "linear-gradient(135deg, oklch(0.65 0.25 30 / 0.15), oklch(0.65 0.25 30 / 0.05))"
                    : "linear-gradient(135deg, oklch(0.62 0.22 295 / 0.12), oklch(0.65 0.25 350 / 0.06))",
                }}
              >
                <Image size={28} className="text-muted-foreground opacity-40" />
                {post.isFlagged && (
                  <div className="absolute top-2 right-2">
                    <Flag size={12} style={{ color: "oklch(0.7 0.22 40)" }} />
                  </div>
                )}
              </div>
              <div className="p-2 flex-1 flex flex-col gap-1">
                <p className="text-[10px] text-foreground font-medium line-clamp-2 flex-1">
                  {post.caption || "(no caption)"}
                </p>
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  <span>❤️ {Number(post.likeCount)}</span>
                  <span>💬 {Number(post.commentCount)}</span>
                  {post.isFlagged && (
                    <span style={{ color: "oklch(0.7 0.22 40)" }}>
                      🚩 {Number(post.flagCount)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/70">
                  {formatDate(post.createdAt)}
                </p>
              </div>
              <div className="px-2 pb-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full h-7 text-[10px]"
                  onClick={() => setConfirmPost(post)}
                  data-ocid="admin-remove-post-btn"
                >
                  Remove
                </Button>
              </div>
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
                if (confirmPost) {
                  removeMutation.mutate(confirmPost.id, {
                    onSuccess: () => {
                      appendAuditLog({
                        adminId: "admin",
                        action: "REMOVE_POST",
                        target: `Post #${confirmPost.id}`,
                        details: confirmPost.caption.slice(0, 50),
                      });
                      toast.success("Post removed");
                      setConfirmPost(null);
                    },
                    onError: () => toast.error("Failed to remove post"),
                  });
                }
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

function WithdrawalsTab({ allUsers }: { allUsers: AdminUserInfo[] }) {
  const { data: requests = [], isLoading } = useAdminGetWithdrawalRequests();
  const { data: fraudScores = [] } = useAdminFraudScores(allUsers);
  const [subTab, setSubTab] = useState<"pending" | "history">("pending");
  const [approveTarget, setApproveTarget] = useState<WithdrawalRequest | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<WithdrawalRequest | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useAdminApproveWithdrawalLocal();
  const rejectMutation = useAdminRejectWithdrawalLocal();

  const pending = requests.filter((r) => r.status === WithdrawalStatus.pending);
  const processed = requests.filter(
    (r) => r.status !== WithdrawalStatus.pending,
  );
  const displayed = subTab === "pending" ? pending : processed;

  function getFraudScore(userId: string) {
    return fraudScores.find((f) => f.userId === userId)?.riskScore ?? 0;
  }

  return (
    <div className="p-4 space-y-3 pb-8">
      <SubTabBar
        tabs={[
          { id: "pending" as const, label: `Pending (${pending.length})` },
          { id: "history" as const, label: `History (${processed.length})` },
        ]}
        active={subTab}
        onChange={setSubTab}
      />

      {isLoading ? (
        <div className="space-y-3">
          {["w1", "w2", "w3"].map((k) => (
            <Skeleton key={k} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          {subTab === "pending" ? (
            <>
              <div className="text-3xl">🎉</div>
              <p className="text-sm font-medium text-foreground">
                All caught up!
              </p>
              <p className="text-xs text-muted-foreground">
                No pending withdrawals
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No withdrawal history
            </p>
          )}
        </div>
      ) : subTab === "pending" ? (
        <div className="space-y-3">
          {pending.map((req) => {
            const score = getFraudScore(req.userId.toString());
            return (
              <div
                key={req.id.toString()}
                className="rounded-2xl border p-4 space-y-3"
                style={{
                  background: "oklch(0.09 0.006 270)",
                  borderColor: "oklch(0.72 0.22 50 / 0.3)",
                }}
                data-ocid="admin-withdrawal-row"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={req.userId.toString().slice(0, 4)}
                      size={36}
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        User withdrawal
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {timeAgo(req.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusPill status="pending" />
                    <RiskBadge score={score} />
                  </div>
                </div>

                <div
                  className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: "oklch(0.72 0.22 50 / 0.08)" }}
                >
                  <div>
                    <p
                      className="text-xl font-bold font-display"
                      style={{ color: "oklch(0.72 0.22 50)" }}
                    >
                      ₹{req.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      via {req.method}
                    </p>
                  </div>
                  <IndianRupee
                    size={24}
                    style={{ color: "oklch(0.72 0.22 50 / 0.5)" }}
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">
                    Account:
                  </span>{" "}
                  {req.accountDetails}
                </div>

                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background:
                        score > 70
                          ? "oklch(0.6 0.24 25)"
                          : score > 30
                            ? "oklch(0.78 0.2 60)"
                            : "oklch(0.65 0.22 130)",
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {score > 70
                      ? "High fraud risk — review carefully"
                      : score > 30
                        ? "Moderate risk"
                        : "No fraud flags detected"}
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 h-9 text-xs font-semibold"
                    style={{ background: "oklch(0.55 0.2 145)", color: "#fff" }}
                    onClick={() => setApproveTarget(req)}
                    data-ocid="admin-approve-btn"
                  >
                    <Check size={13} className="mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 h-9 text-xs font-semibold"
                    onClick={() => setRejectTarget(req)}
                    data-ocid="admin-reject-btn"
                  >
                    <X size={13} className="mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {processed.map((req) => (
            <div
              key={req.id.toString()}
              className="flex items-center gap-3 rounded-xl p-3 border"
              style={{
                background: "oklch(0.09 0.006 270)",
                borderColor: "oklch(0.2 0.01 280)",
              }}
              data-ocid="admin-withdrawal-history-row"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold font-display text-foreground">
                    ₹{req.amount.toLocaleString()}
                  </span>
                  <StatusPill status={req.status} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {req.accountDetails} · {formatDate(req.createdAt)}
                </p>
                {req.rejectionReason && (
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: "oklch(0.6 0.24 25)" }}
                  >
                    Reason: {req.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <DialogContent className="bg-card border-border max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Approve Withdrawal
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Approve ₹{approveTarget?.amount.toLocaleString()} withdrawal? This
            action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApproveTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              style={{ background: "oklch(0.55 0.2 145)", color: "#fff" }}
              disabled={approveMutation.isPending}
              onClick={() => {
                if (approveTarget) {
                  approveMutation.mutate(approveTarget.id, {
                    onSuccess: () => {
                      appendAuditLog({
                        adminId: "admin",
                        action: "APPROVE_WITHDRAWAL",
                        target: `₹${approveTarget.amount}`,
                        details: `Approved for user ${approveTarget.userId.toString().slice(0, 8)}`,
                      });
                      toast.success(
                        `✅ Withdrawal of ₹${approveTarget.amount} approved`,
                      );
                      setApproveTarget(null);
                    },
                    onError: () => toast.error("Failed to approve"),
                  });
                }
              }}
              data-ocid="admin-approve-confirm"
            >
              {approveMutation.isPending ? "Approving..." : "Confirm Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
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
            Rejecting ₹{rejectTarget?.amount.toLocaleString()} — funds will be
            returned to wallet.
          </p>
          <Input
            placeholder="Reason for rejection (required)..."
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
                if (rejectTarget) {
                  rejectMutation.mutate(
                    { txId: rejectTarget.id, reason: rejectReason },
                    {
                      onSuccess: () => {
                        appendAuditLog({
                          adminId: "admin",
                          action: "REJECT_WITHDRAWAL",
                          target: `₹${rejectTarget.amount}`,
                          details: rejectReason,
                        });
                        toast.success("Withdrawal rejected");
                        setRejectTarget(null);
                        setRejectReason("");
                      },
                      onError: () => toast.error("Failed to reject"),
                    },
                  );
                }
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

// Local withdrawal mutation wrappers (to access actor inside component)
function useAdminApproveWithdrawalLocal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminApproveWithdrawal(txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["adminAnalytics"] });
      queryClient.invalidateQueries({ queryKey: ["myWallet"] });
    },
  });
}

function useAdminRejectWithdrawalLocal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ txId, reason }: { txId: bigint; reason: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminRejectWithdrawal(txId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["myWallet"] });
    },
  });
}

// ─── Referrals Tab ────────────────────────────────────────────────────────────

const MEDAL_COLORS = [
  "oklch(0.8 0.2 60)",
  "oklch(0.75 0.02 270)",
  "oklch(0.65 0.18 40)",
];

function ReferralsTab({ allUsers }: { allUsers: AdminUserInfo[] }) {
  const { data, isLoading } = useAdminGetReferralStats();
  const { data: analytics } = useAdminGetAnalytics();
  const { data: fraudScores = [] } = useAdminFraudScores(allUsers);
  const [subTab, setSubTab] = useState<"leaderboard" | "fraud">("leaderboard");
  const suspendMutation = useAdminSuspendUser();
  const queryClient = useQueryClient();

  const highRiskUsers = fraudScores
    .filter((f) => f.riskScore > 30)
    .sort((a, b) => b.riskScore - a.riskScore);

  const statCards = [
    {
      label: "Total Referrals",
      value: Number(data?.totalReferrals ?? 0).toLocaleString(),
      color: "oklch(0.72 0.24 295)",
    },
    {
      label: "Total Paid Out",
      value: `₹${(data?.totalPaid ?? 0).toLocaleString()}`,
      color: "oklch(0.65 0.22 130)",
    },
    {
      label: "Pending Payout",
      value: `₹${(data?.pendingPayout ?? 0).toLocaleString()}`,
      color: "oklch(0.72 0.22 50)",
    },
    {
      label: "Signup Rewards",
      value: `₹${(Number(analytics?.newUsersThisWeek ?? 0) * 10).toLocaleString()}`,
      color: "oklch(0.68 0.25 350)",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {["r1", "r2", "r3", "r4"].map((k) => (
            <Skeleton key={k} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      <div>
        <SectionHeader title="Referral Summary" />
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4 border"
              style={{
                background: "oklch(0.09 0.006 270)",
                borderColor: `${s.color}35`,
              }}
            >
              <div
                className="text-xl font-bold font-display"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SubTabBar
        tabs={[
          { id: "leaderboard" as const, label: "🏆 Leaderboard" },
          { id: "fraud" as const, label: `⚠️ Fraud (${highRiskUsers.length})` },
        ]}
        active={subTab}
        onChange={setSubTab}
      />

      {subTab === "leaderboard" ? (
        !data?.topReferrers?.length ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <Trophy size={28} className="text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">
              No referral data yet
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "oklch(0.09 0.006 270)",
              borderColor: "oklch(0.2 0.01 280)",
            }}
          >
            <div
              className="grid grid-cols-[36px_1fr_60px] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
              style={{ background: "oklch(0.12 0.008 270)" }}
            >
              <span>#</span>
              <span>User</span>
              <span className="text-right">Earned</span>
            </div>
            {data.topReferrers.map((r, i) => (
              <div
                key={r.username}
                className="grid grid-cols-[36px_1fr_60px] px-3 py-3 border-t items-center transition-colors hover:bg-muted/20"
                style={{ borderColor: "oklch(0.16 0.008 270)" }}
                data-ocid="admin-referrer-row"
              >
                <div className="flex items-center justify-center">
                  {i < 3 ? (
                    <Medal size={16} style={{ color: MEDAL_COLORS[i] }} />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar name={r.username} size={28} />
                  <span
                    className="text-xs font-semibold truncate"
                    style={{
                      color: i < 3 ? MEDAL_COLORS[i] : "oklch(0.9 0.01 280)",
                    }}
                  >
                    @{r.username}
                  </span>
                </div>
                <span
                  className="text-xs font-bold text-right"
                  style={{ color: "oklch(0.65 0.22 130)" }}
                >
                  ₹{r.earnings.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          {highRiskUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Check size={28} className="text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">
                No suspicious accounts detected
              </p>
            </div>
          ) : (
            highRiskUsers.map((fs) => {
              const user = allUsers.find(
                (u) => u.userId.toString() === fs.userId,
              );
              return (
                <div
                  key={fs.userId}
                  className="rounded-2xl border p-3 flex items-center gap-3"
                  style={{
                    background: "oklch(0.6 0.24 25 / 0.06)",
                    borderColor: "oklch(0.6 0.24 25 / 0.3)",
                  }}
                  data-ocid="admin-fraud-row"
                >
                  <UserAvatar name={fs.username} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">
                        @{fs.username}
                      </span>
                      <RiskBadge score={fs.riskScore} />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {fs.flags.map((flag) => (
                        <span
                          key={flag}
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "oklch(0.6 0.24 25 / 0.15)",
                            color: "oklch(0.7 0.22 30)",
                          }}
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {user && !user.isSuspended && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-[10px] h-7 px-2 shrink-0"
                      disabled={suspendMutation.isPending}
                      onClick={() => {
                        suspendMutation.mutate(user.userId, {
                          onSuccess: () => {
                            appendAuditLog({
                              adminId: "admin",
                              action: "SUSPEND_USER",
                              target: `@${fs.username}`,
                              details: "Suspended via fraud detection",
                            });
                            toast.success(`User @${fs.username} suspended`);
                            queryClient.invalidateQueries({
                              queryKey: ["adminUsers"],
                            });
                          },
                        });
                      }}
                      data-ocid="admin-fraud-suspend-btn"
                    >
                      Suspend
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <div
        className="rounded-2xl border p-4 flex items-start gap-3"
        style={{
          background: "oklch(0.65 0.25 30 / 0.06)",
          borderColor: "oklch(0.65 0.25 30 / 0.3)",
        }}
      >
        <AlertTriangle
          size={16}
          style={{ color: "oklch(0.7 0.22 40)" }}
          className="shrink-0 mt-0.5"
        />
        <div>
          <p className="text-xs font-semibold text-foreground">
            Anti-fraud monitoring active
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Duplicate devices, rapid referrals, and inactivity patterns are
            automatically flagged for review.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Rewards Settings Tab ─────────────────────────────────────────────────────

function RewardsTab() {
  const { data: rewards, isLoading } = useAdminRewards();
  const setRewardsMutation = useAdminSetRewards();
  const [signup, setSignup] = useState("");
  const [reel, setReel] = useState("");
  const [follower, setFollower] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (rewards && !initialized) {
    setSignup(String(rewards.signupBonus));
    setReel(String(rewards.reelBonus));
    setFollower(String(rewards.followerBonus));
    setInitialized(true);
  }

  const handleSave = () => {
    const config = {
      signupBonus: Number(signup),
      reelBonus: Number(reel),
      followerBonus: Number(follower),
    };
    setRewardsMutation.mutate(config, {
      onSuccess: () => {
        appendAuditLog({
          adminId: "admin",
          action: "SET_REWARDS",
          target: "Reward Config",
          details: `Signup ₹${config.signupBonus}, Reel ₹${config.reelBonus}, Followers ₹${config.followerBonus}`,
        });
        toast.success(
          `Rewards updated! New signups will earn ₹${config.signupBonus}`,
        );
      },
    });
  };

  if (isLoading)
    return (
      <div className="p-4 space-y-3">
        {["a", "b", "c"].map((k) => (
          <Skeleton key={k} className="h-20 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="p-4 space-y-5 pb-8">
      <div
        className="rounded-2xl border p-4"
        style={{
          background: "oklch(0.09 0.006 270)",
          borderColor: "oklch(0.22 0.015 280)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "oklch(0.62 0.22 295 / 0.2)",
              color: "oklch(0.72 0.24 295)",
            }}
          >
            <Gift size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground font-display">
              Referral Reward Amounts
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Changes apply to new events only
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            {
              label: "Signup Bonus (₹)",
              desc: "When referred user registers",
              value: signup,
              set: setSignup,
              icon: "👤",
            },
            {
              label: "First Reel Bonus (₹)",
              desc: "When referred user posts first reel",
              value: reel,
              set: setReel,
              icon: "🎬",
            },
            {
              label: "100 Followers Bonus (₹)",
              desc: "When referred user reaches 100 followers",
              value: follower,
              set: setFollower,
              icon: "🏆",
            },
          ].map((field) => (
            <div key={field.label}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{field.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {field.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {field.desc}
                  </p>
                </div>
              </div>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                  style={{ color: "oklch(0.65 0.22 130)" }}
                >
                  ₹
                </span>
                <Input
                  type="number"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  min="0"
                  className="pl-8 bg-background border-border text-sm h-10"
                  data-ocid={`admin-reward-${field.label.toLowerCase().replace(/\s+/g, "-")}`}
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          className="w-full mt-5 h-11 font-bold text-sm"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
            color: "#fff",
          }}
          disabled={
            setRewardsMutation.isPending || !signup || !reel || !follower
          }
          onClick={handleSave}
          data-ocid="admin-save-rewards-btn"
        >
          {setRewardsMutation.isPending
            ? "Saving..."
            : "💾 Save Reward Settings"}
        </Button>
      </div>

      {/* Preview */}
      <div
        className="rounded-2xl border p-4"
        style={{
          background: "oklch(0.09 0.006 270)",
          borderColor: "oklch(0.22 0.015 280)",
        }}
      >
        <SectionHeader
          title="Reward Preview"
          subtitle="How rewards look to users"
        />
        <div className="space-y-2">
          {[
            {
              event: "Friend signs up",
              amount: signup,
              color: "oklch(0.72 0.24 295)",
            },
            {
              event: "Friend posts first reel",
              amount: reel,
              color: "oklch(0.65 0.25 350)",
            },
            {
              event: "Friend hits 100 followers",
              amount: follower,
              color: "oklch(0.68 0.2 150)",
            },
          ].map((item) => (
            <div
              key={item.event}
              className="flex items-center justify-between rounded-xl p-3 border"
              style={{
                background: `${item.color}0A`,
                borderColor: `${item.color}30`,
              }}
            >
              <span className="text-xs text-muted-foreground">
                {item.event}
              </span>
              <span className="text-sm font-bold" style={{ color: item.color }}>
                +₹{item.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────

function AuditLogTab() {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const { data, isLoading } = useAdminAuditLog(page, PAGE_SIZE);

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex items-center justify-between">
        <SectionHeader title="Audit Log" subtitle={`${total} total actions`} />
        <span className="text-[10px] text-muted-foreground">
          {total} entries
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => `al-${i}`).map((k) => (
            <Skeleton key={k} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <BookOpen size={32} className="text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            No admin actions logged yet
          </p>
          <p className="text-xs text-muted-foreground/70">
            Actions will appear here after you make changes
          </p>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div className="rounded-t-xl overflow-hidden">
            <div
              className="grid grid-cols-[70px_1fr_80px] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
              style={{
                background: "oklch(0.12 0.008 270)",
                border: "1px solid oklch(0.2 0.01 280)",
                borderBottom: "none",
              }}
            >
              <span>Time</span>
              <span>Action / Target</span>
              <span className="text-right">Admin</span>
            </div>
          </div>

          <div
            className="rounded-b-xl border overflow-hidden divide-y"
            style={{
              borderColor: "oklch(0.2 0.01 280)",
              borderTop: "none",
              background: "oklch(0.09 0.006 270)",
            }}
          >
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="px-3 py-2.5 transition-colors hover:bg-muted/10"
                data-ocid="admin-audit-row"
              >
                <div className="grid grid-cols-[70px_1fr_80px] items-start gap-1">
                  <span className="text-[10px] text-muted-foreground pt-0.5">
                    {new Date(entry.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <ActionBadge action={entry.action} />
                      <span className="text-[10px] font-semibold text-foreground truncate">
                        {entry.target}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {entry.details}
                    </p>
                  </div>
                  <span className="text-[10px] text-right text-muted-foreground truncate">
                    @{entry.adminId}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-40 hover:text-foreground transition-colors"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-40 hover:text-foreground transition-colors"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={13} /> },
  { id: "users", label: "Users", icon: <Users size={13} /> },
  { id: "posts", label: "Posts", icon: <FileText size={13} /> },
  { id: "withdrawals", label: "Payouts", icon: <IndianRupee size={13} /> },
  { id: "referrals", label: "Referrals", icon: <Trophy size={13} /> },
  { id: "rewards", label: "Rewards", icon: <Gift size={13} /> },
  { id: "audit", label: "Audit Log", icon: <BookOpen size={13} /> },
];

// ─── Admin Page ───────────────────────────────────────────────────────────────

export function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [adminTheme, setAdminTheme] = useState<AdminTheme>("dark");
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: allUsers = [] } = useAdminSearchUsers("");
  const queryClient = useQueryClient();

  const handleRefreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["adminAnalytics"] });
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
    queryClient.invalidateQueries({ queryKey: ["adminFlaggedPosts"] });
    queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
    queryClient.invalidateQueries({ queryKey: ["adminReferralStats"] });
    queryClient.invalidateQueries({ queryKey: ["adminFraudScores"] });
    queryClient.invalidateQueries({ queryKey: ["adminAuditLog"] });
    toast.success("Data refreshed");
  }, [queryClient]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-20 h-3" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: "oklch(0.2 0.08 25 / 0.3)",
            border: "1px solid oklch(0.6 0.24 25 / 0.3)",
          }}
        >
          <Shield size={32} style={{ color: "oklch(0.65 0.25 25)" }} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground font-display mb-2">
            Access Denied
          </h1>
          <p className="text-sm text-muted-foreground">
            You do not have admin access to this panel.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Contact a Super Admin to request access.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/" })}
          data-ocid="admin-access-denied-back"
        >
          <ArrowLeft size={14} className="mr-2" /> Go to Home
        </Button>
      </div>
    );
  }

  const isDark = adminTheme === "dark";

  return (
    <div
      className="min-h-screen"
      style={{
        background: isDark ? "oklch(0.05 0.005 270)" : "oklch(0.97 0.003 270)",
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-3 py-2.5 flex items-center gap-2 border-b"
        style={{
          background: isDark
            ? "oklch(0.07 0.005 270)"
            : "oklch(0.99 0.003 270)",
          borderColor: isDark
            ? "oklch(0.18 0.01 280)"
            : "oklch(0.88 0.005 270)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          data-ocid="admin-header-back"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-sm shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
            }}
          >
            B
          </div>
          <h1
            className="text-base font-bold font-display truncate"
            style={{
              color: isDark ? "oklch(0.9 0.01 280)" : "oklch(0.1 0.01 280)",
            }}
          >
            Butki <span style={{ color: "oklch(0.72 0.24 295)" }}>Admin</span>
          </h1>
        </div>

        {/* Live badge */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
          style={{
            background: "oklch(0.65 0.22 150 / 0.15)",
            border: "1px solid oklch(0.65 0.22 150 / 0.3)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "oklch(0.65 0.22 150)" }}
          />
          <span
            className="text-[10px] font-bold"
            style={{ color: "oklch(0.65 0.22 150)" }}
          >
            LIVE
          </span>
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={handleRefreshAll}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          data-ocid="admin-refresh-btn"
          title="Refresh Now"
        >
          <RefreshCw size={14} />
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setAdminTheme(isDark ? "light" : "dark")}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          data-ocid="admin-theme-toggle"
          title="Toggle theme"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Admin badge */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
          style={{
            background: "oklch(0.62 0.22 295 / 0.15)",
            border: "1px solid oklch(0.62 0.22 295 / 0.3)",
          }}
        >
          <Shield size={11} style={{ color: "oklch(0.72 0.24 295)" }} />
          <span
            className="text-[10px] font-bold"
            style={{ color: "oklch(0.72 0.24 295)" }}
          >
            ADMIN
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="sticky top-[49px] z-10 border-b overflow-x-auto scrollbar-none"
        style={{
          background: isDark
            ? "oklch(0.07 0.005 270)"
            : "oklch(0.99 0.003 270)",
          borderColor: isDark
            ? "oklch(0.18 0.01 280)"
            : "oklch(0.88 0.005 270)",
        }}
      >
        <div className="flex min-w-max px-3 py-1.5 gap-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                style={
                  active
                    ? {
                        background: "oklch(0.62 0.22 295)",
                        color: "#fff",
                        boxShadow: "0 0 14px oklch(0.62 0.22 295 / 0.45)",
                      }
                    : {
                        color: isDark
                          ? "oklch(0.55 0.01 270)"
                          : "oklch(0.45 0.01 270)",
                        background: "transparent",
                      }
                }
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
      <div
        className="pb-safe"
        style={{
          color: isDark ? "oklch(0.9 0.01 280)" : "oklch(0.1 0.01 280)",
        }}
      >
        {activeTab === "dashboard" && (
          <DashboardTab onSwitchTab={setActiveTab} allUsers={allUsers} />
        )}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "posts" && <PostsTab />}
        {activeTab === "withdrawals" && <WithdrawalsTab allUsers={allUsers} />}
        {activeTab === "referrals" && <ReferralsTab allUsers={allUsers} />}
        {activeTab === "rewards" && <RewardsTab />}
        {activeTab === "audit" && <AuditLogTab />}
      </div>
    </div>
  );
}
