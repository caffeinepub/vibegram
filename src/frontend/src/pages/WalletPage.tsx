import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Gift,
  IndianRupee,
  Share2,
  Smartphone,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  WalletTransaction,
  WalletTxType,
  WithdrawalMethod,
} from "../backend.d";
import {
  WalletTxType as TxTypeEnum,
  WalletTxStatus as _WalletTxStatus,
} from "../backend.d";
import {
  useGetMyWallet,
  useGetReferralStats,
  useGetWithdrawalHistory,
  useRequestWithdrawal,
} from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

function formatTime(ts: bigint) {
  const d = new Date(Number(ts) / 1_000_000);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function txTypeLabel(type: WalletTxType): string {
  switch (type) {
    case TxTypeEnum.referralSignup:
      return "Friend signed up";
    case TxTypeEnum.referralReel:
      return "Friend posted first reel";
    case TxTypeEnum.referralFollowers:
      return "Friend reached 100 followers";
    case TxTypeEnum.withdrawal:
      return "Withdrawal";
    default:
      return "Reward";
  }
}

function txTypeIcon(type: WalletTxType) {
  switch (type) {
    case TxTypeEnum.referralSignup:
      return <Users size={16} className="text-[oklch(0.75_0.22_145)]" />;
    case TxTypeEnum.referralReel:
      return <Star size={16} className="text-[oklch(0.82_0.22_85)]" />;
    case TxTypeEnum.referralFollowers:
      return <TrendingUp size={16} className="text-[oklch(0.75_0.22_145)]" />;
    case TxTypeEnum.withdrawal:
      return <Banknote size={16} className="text-muted-foreground" />;
    default:
      return <Gift size={16} className="text-accent" />;
  }
}

// ─── Earning Steps ─────────────────────────────────────────────────────────────

const EARNING_STEPS = [
  {
    icon: <Users size={20} />,
    label: "Friend signs up",
    amount: "₹10",
    color: "oklch(0.75 0.22 145)",
  },
  {
    icon: <Star size={20} />,
    label: "Friend posts first reel",
    amount: "₹20",
    color: "oklch(0.82 0.22 85)",
  },
  {
    icon: <TrendingUp size={20} />,
    label: "Friend reaches 100 followers",
    amount: "₹50",
    color: "oklch(0.72 0.24 295)",
  },
];

// ─── Balance Card ─────────────────────────────────────────────────────────────

function BalanceCard({
  balance,
  loading,
}: { balance: number; loading: boolean }) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.18 0.06 290), oklch(0.15 0.06 350), oklch(0.12 0.04 225))",
      }}
    >
      {/* Decorative glow */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl"
        style={{ background: "oklch(0.65 0.24 295)" }}
      />
      <div
        className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-15 blur-2xl"
        style={{ background: "oklch(0.68 0.26 350)" }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={16} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Butki Wallet
          </span>
        </div>

        {loading ? (
          <Skeleton className="h-12 w-40 mb-1" />
        ) : (
          <div className="flex items-end gap-1 mb-1">
            <span
              className="text-5xl font-bold font-display"
              style={{ color: "oklch(0.82 0.22 145)" }}
            >
              ₹{balance.toFixed(2)}
            </span>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Total Earned — keep inviting to earn more!
        </p>
      </div>
    </div>
  );
}

// ─── Referral Card ────────────────────────────────────────────────────────────

function ReferralCard({
  code,
  totalReferrals,
  totalEarned,
  loading,
}: {
  code: string;
  totalReferrals: bigint;
  totalEarned: number;
  loading: boolean;
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Referral code copied!");
  };

  const handleShare = () => {
    const url = `${window.location.origin}?ref=${code}`;
    if (navigator.share) {
      navigator.share({
        title: "Join me on Butki!",
        text: `Use my referral code ${code} to sign up and we both earn!`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Referral link copied!");
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Gift size={18} className="text-primary" />
        <h2 className="text-base font-semibold text-foreground">
          Your Referral Code
        </h2>
      </div>

      {loading ? (
        <Skeleton className="h-14 w-full rounded-xl" />
      ) : (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3 border"
          style={{
            borderColor: "oklch(0.62 0.22 295 / 0.5)",
            background: "oklch(0.10 0.03 290)",
          }}
        >
          <span
            className="font-mono text-2xl font-bold tracking-widest"
            style={{ color: "oklch(0.78 0.24 295)" }}
          >
            {code}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              data-ocid="referral-copy-btn"
              className="p-2 rounded-lg transition-colors hover:bg-primary/20"
              aria-label="Copy referral code"
            >
              <Copy size={18} className="text-primary" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              data-ocid="referral-share-btn"
              className="p-2 rounded-lg transition-colors hover:bg-accent/20"
              aria-label="Share referral link"
            >
              <Share2 size={18} className="text-accent" />
            </button>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center">
        Invite friends and earn{" "}
        <span
          style={{ color: "oklch(0.82 0.22 145)" }}
          className="font-semibold"
        >
          ₹10–₹50
        </span>{" "}
        per referral!
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Referrals</p>
          {loading ? (
            <Skeleton className="h-6 w-12 mx-auto" />
          ) : (
            <p className="text-xl font-bold text-foreground">
              {Number(totalReferrals)}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
          {loading ? (
            <Skeleton className="h-6 w-16 mx-auto" />
          ) : (
            <p
              className="text-xl font-bold"
              style={{ color: "oklch(0.82 0.22 145)" }}
            >
              {formatAmount(totalEarned)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen((v) => !v)}
        data-ocid="how-it-works-toggle"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <BadgeCheck size={18} className="text-primary" />
          <span className="text-base font-semibold text-foreground">
            How It Works
          </span>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={18} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {EARNING_STEPS.map((step) => (
            <div
              key={step.label}
              className="flex items-center gap-3 rounded-xl bg-muted p-3"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${step.color}22`, color: step.color }}
              >
                {step.icon}
              </div>
              <span className="text-sm text-foreground flex-1 min-w-0">
                {step.label}
              </span>
              <span
                className="text-base font-bold flex-shrink-0 font-display"
                style={{ color: step.color }}
              >
                {step.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Transaction History ───────────────────────────────────────────────────────

function TransactionHistory({
  transactions,
  loading,
}: { transactions: WalletTransaction[]; loading: boolean }) {
  const earnings = transactions.filter(
    (t) => t.txType !== TxTypeEnum.withdrawal,
  );

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <IndianRupee size={18} className="text-primary" />
        <h2 className="text-base font-semibold text-foreground">
          Earnings History
        </h2>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      ) : earnings.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-8 text-center"
          data-ocid="earnings-empty-state"
        >
          <Gift size={32} className="text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            No earnings yet
          </p>
          <p className="text-xs text-muted-foreground">
            Share your referral code to start earning!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border" data-ocid="earnings-list">
          {earnings.map((tx) => (
            <div
              key={tx.id.toString()}
              className="flex items-center gap-3 px-4 py-3"
              data-ocid={`earnings-item-${tx.id}`}
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {txTypeIcon(tx.txType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {tx.description || txTypeLabel(tx.txType)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(tx.timestamp)}
                </p>
              </div>
              <span
                className="text-sm font-bold flex-shrink-0"
                style={{ color: "oklch(0.75 0.22 145)" }}
              >
                +{formatAmount(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Withdrawal Status Badge ───────────────────────────────────────────────────

function WithdrawalStatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <Badge className="bg-[oklch(0.75_0.22_145)] text-black text-[10px]">
        Approved
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge variant="destructive" className="text-[10px]">
        Rejected
      </Badge>
    );
  return (
    <Badge className="bg-[oklch(0.75_0.22_85)] text-black text-[10px]">
      Pending
    </Badge>
  );
}

// ─── Withdrawal Section ────────────────────────────────────────────────────────

function WithdrawSection({
  balance,
  onSuccess,
}: { balance: number; onSuccess: () => void }) {
  const MIN_WITHDRAWAL = 100;
  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const [amount, setAmount] = useState(balance.toFixed(2));
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");

  const withdrawMutation = useRequestWithdrawal();

  const handleSubmit = async () => {
    const numAmount = Number.parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ₹${MIN_WITHDRAWAL}`);
      return;
    }
    if (numAmount > balance) {
      toast.error("Amount exceeds available balance");
      return;
    }

    const withdrawalMethod: WithdrawalMethod =
      method === "upi"
        ? { __kind__: "upi", upi: upiId }
        : { __kind__: "bankTransfer", bankTransfer: { accountNumber, ifsc } };

    if (method === "upi" && !upiId.trim()) {
      toast.error("Please enter your UPI ID");
      return;
    }
    if (method === "bank" && (!accountNumber.trim() || !ifsc.trim())) {
      toast.error("Please fill in all bank details");
      return;
    }

    try {
      const result = await withdrawMutation.mutateAsync({
        amount: numAmount,
        method: withdrawalMethod,
      });
      if ("err" in result && result.__kind__ === "err") {
        toast.error(result.err);
      } else {
        toast.success(
          "Withdrawal request submitted! Review within 24–48 hours.",
        );
        onSuccess();
      }
    } catch {
      toast.error("Failed to submit withdrawal request");
    }
  };

  if (balance < MIN_WITHDRAWAL) {
    return (
      <div
        className="rounded-2xl bg-card border border-border p-5"
        data-ocid="withdraw-locked"
      >
        <div className="flex items-center gap-2 mb-3">
          <Banknote size={18} className="text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">
            Withdraw Earnings
          </h2>
        </div>
        <div className="rounded-xl bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Minimum withdrawal is ₹{MIN_WITHDRAWAL}
          </p>
          <p
            className="text-sm font-semibold"
            style={{ color: "oklch(0.82 0.22 85)" }}
          >
            You need ₹{(MIN_WITHDRAWAL - balance).toFixed(2)} more
          </p>
          <div className="mt-3 w-full h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min((balance / MIN_WITHDRAWAL) * 100, 100)}%`,
                background:
                  "linear-gradient(90deg, oklch(0.65 0.24 295), oklch(0.68 0.26 350))",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {balance.toFixed(2)} / ₹{MIN_WITHDRAWAL}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl bg-card border border-border p-5 space-y-4"
      data-ocid="withdraw-section"
    >
      <div className="flex items-center gap-2">
        <Banknote size={18} className="text-primary" />
        <h2 className="text-base font-semibold text-foreground">
          Withdraw Earnings
        </h2>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Amount (₹)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            ₹
          </span>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7 bg-muted border-border"
            placeholder="100.00"
            data-ocid="withdraw-amount-input"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Available: {formatAmount(balance)}
        </p>
      </div>

      {/* Method Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMethod("upi")}
          data-ocid="method-upi-tab"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            method === "upi"
              ? "text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
          style={
            method === "upi"
              ? {
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.24 295), oklch(0.68 0.26 350))",
                }
              : {}
          }
        >
          <Smartphone size={14} />
          UPI
        </button>
        <button
          type="button"
          onClick={() => setMethod("bank")}
          data-ocid="method-bank-tab"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            method === "bank"
              ? "text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
          style={
            method === "bank"
              ? {
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.24 295), oklch(0.68 0.26 350))",
                }
              : {}
          }
        >
          <Banknote size={14} />
          Bank
        </button>
      </div>

      {/* UPI */}
      {method === "upi" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">UPI ID</Label>
          <Input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@upi"
            className="bg-muted border-border"
            data-ocid="upi-id-input"
          />
        </div>
      )}

      {/* Bank Transfer */}
      {method === "bank" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Account Number
            </Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
              className="bg-muted border-border"
              data-ocid="account-number-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">IFSC Code</Label>
            <Input
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              placeholder="SBIN0001234"
              className="bg-muted border-border"
              data-ocid="ifsc-input"
            />
          </div>
        </div>
      )}

      <Button
        className="w-full btn-hotpink"
        onClick={handleSubmit}
        disabled={withdrawMutation.isPending}
        data-ocid="submit-withdrawal-btn"
      >
        {withdrawMutation.isPending
          ? "Submitting..."
          : "Submit Withdrawal Request"}
      </Button>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <Clock size={12} />
        Withdrawals are reviewed within 24–48 hours
      </p>
    </div>
  );
}

// ─── Withdrawal History ────────────────────────────────────────────────────────

function WithdrawalHistory({
  withdrawals,
  loading,
}: { withdrawals: WalletTransaction[]; loading: boolean }) {
  const items = withdrawals.filter((t) => t.txType === TxTypeEnum.withdrawal);

  if (!loading && items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Clock size={18} className="text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">
          Withdrawal History
        </h2>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="divide-y divide-border"
          data-ocid="withdrawal-history-list"
        >
          {items.map((tx) => (
            <div
              key={tx.id.toString()}
              className="flex items-center gap-3 px-4 py-3"
              data-ocid={`withdrawal-item-${tx.id}`}
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Banknote size={16} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {tx.description || "Withdrawal Request"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(tx.timestamp)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-sm font-bold text-destructive">
                  -{formatAmount(tx.amount)}
                </span>
                <WithdrawalStatusBadge status={tx.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WalletPage ────────────────────────────────────────────────────────────────

export function WalletPage() {
  const router = useRouter();
  const {
    data: walletData,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useGetMyWallet();
  const { data: referralStats, isLoading: referralLoading } =
    useGetReferralStats();

  const balance = walletData?.balance ?? 0;
  const transactions: WalletTransaction[] = walletData?.transactions ?? [];
  const code = referralStats?.referralCode ?? "—";
  const totalReferrals = referralStats?.totalReferrals ?? BigInt(0);
  const totalEarned = referralStats?.totalEarned ?? 0;

  return (
    <div className="min-h-screen bg-background" data-ocid="wallet-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="p-2 rounded-full hover:bg-muted transition-colors -ml-2"
          aria-label="Go back"
          data-ocid="wallet-back-btn"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-display flex-1">
          My Wallet
        </h1>
        <IndianRupee size={20} className="text-primary" />
      </header>

      {/* Content */}
      <div className="px-4 py-4 space-y-4 pb-safe">
        {/* Balance */}
        <BalanceCard balance={balance} loading={walletLoading} />

        {/* Referral Code */}
        <ReferralCard
          code={code}
          totalReferrals={totalReferrals}
          totalEarned={totalEarned}
          loading={referralLoading}
        />

        {/* How It Works */}
        <HowItWorks />

        {/* Earnings History */}
        <TransactionHistory
          transactions={transactions}
          loading={walletLoading}
        />

        {/* Withdraw */}
        <WithdrawSection balance={balance} onSuccess={() => refetchWallet()} />

        {/* Withdrawal History */}
        <WithdrawalHistory withdrawals={transactions} loading={walletLoading} />

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-2">
          © 2026 Butki. All Rights Reserved. Developed by Spandan.
        </p>
      </div>
    </div>
  );
}
