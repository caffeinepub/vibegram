import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Database,
  Eye,
  Lock,
  Shield,
  UserCheck,
} from "lucide-react";

interface PolicySectionProps {
  icon: React.FC<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}

function PolicySection({ icon: Icon, title, children }: PolicySectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "oklch(0.62 0.22 295 / 0.15)" }}
        >
          <Icon size={16} className="text-vibe-purple" />
        </div>
        <h2 className="text-base font-bold font-display text-foreground">
          {title}
        </h2>
      </div>
      <div className="pl-10 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col min-h-screen pb-safe"
      style={{ background: "oklch(0 0 0)" }}
    >
      {/* Header */}
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
          onClick={() => navigate({ to: "/settings" })}
          className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Back"
          data-ocid="privacy_policy.back.button"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold font-display">Privacy Policy</h1>
      </header>

      <main className="flex-1 px-4 py-6 space-y-8 max-w-[430px] w-full mx-auto">
        {/* Intro */}
        <div
          className="rounded-2xl p-4 border border-border"
          style={{ background: "oklch(0.07 0.005 270)" }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            VibeGram is committed to protecting your privacy. This policy
            explains how we collect, use, and safeguard your personal
            information.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            Last updated: January 2026
          </p>
        </div>

        {/* Sections */}
        <PolicySection icon={Database} title="Data We Collect">
          We collect only the information necessary to operate VibeGram: your
          username, display name, bio, and profile photo. We may also store
          posts, stories, reels, and messages you create on the platform. No
          sensitive personal data such as real name, address, or financial
          information is required.
        </PolicySection>

        <PolicySection icon={Eye} title="How We Use Data">
          Your data is used solely to provide VibeGram services — showing your
          profile to followers, delivering your posts in feeds, and enabling
          messaging. We do not sell, rent, or share your personal data with
          third parties for advertising purposes. Usage analytics may be
          collected in aggregate to improve the platform.
        </PolicySection>

        <PolicySection icon={Lock} title="Data Security">
          All user data is stored securely on the Internet Computer blockchain,
          a decentralized infrastructure designed for high security and
          availability. Data is protected using cryptographic standards and is
          accessible only through authenticated requests. We take reasonable
          precautions to prevent unauthorized access.
        </PolicySection>

        <PolicySection icon={UserCheck} title="Your Rights">
          You have the right to access, edit, or delete your account and
          associated data at any time. To delete your account, go to Settings
          &gt; Account Control. You may also control who sees your content
          through Privacy settings, including limiting stories to followers or
          close friends only.
        </PolicySection>

        <PolicySection icon={Shield} title="Contact">
          If you have questions or concerns about your privacy on VibeGram,
          please use the in-app Help section under Settings &gt; Support &gt;
          Help. Our team reviews all privacy inquiries within 5 business days.
        </PolicySection>

        {/* Footer */}
        <div className="text-center py-4 space-y-1">
          <p className="text-xs text-muted-foreground/60">
            © 2026 VibeGram. All Rights Reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Developed by{" "}
            <span className="text-vibe-purple font-semibold">Spandan</span>
          </p>
        </div>
      </main>
    </div>
  );
}
