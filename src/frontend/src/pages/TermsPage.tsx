import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  FileCheck,
  Gavel,
  Scale,
} from "lucide-react";

interface TermsSectionProps {
  icon: React.FC<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}

function TermsSection({ icon: Icon, title, children }: TermsSectionProps) {
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

export function TermsPage() {
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
          data-ocid="terms.back.button"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold font-display">
          Terms &amp; Conditions
        </h1>
      </header>

      <main className="flex-1 px-4 py-6 space-y-8 max-w-[430px] w-full mx-auto">
        {/* Intro */}
        <div
          className="rounded-2xl p-4 border border-border"
          style={{ background: "oklch(0.07 0.005 270)" }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            By accessing or using VibeGrom, you agree to be bound by these Terms
            and Conditions. Please read them carefully before using the
            platform.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            Effective: January 2026
          </p>
        </div>

        {/* Sections */}
        <TermsSection icon={BookOpen} title="Acceptable Use">
          You agree to use VibeGrom only for lawful purposes and in a way that
          does not infringe the rights of others. You must not use the platform
          to harass, abuse, threaten, or discriminate against any individual or
          group. Spam, unsolicited messages, and bot activity are strictly
          prohibited.
        </TermsSection>

        <TermsSection icon={AlertTriangle} title="Content Policy">
          Users must not upload, share, or distribute content that is illegal,
          harmful, abusive, defamatory, obscene, or violates the rights of
          others. This includes but is not limited to: child exploitation
          material, graphic violence, hate speech, copyright infringement, or
          content that promotes illegal activities. All content is subject to
          review.
        </TermsSection>

        <TermsSection icon={Scale} title="Account Rules">
          You are responsible for maintaining the confidentiality of your
          account credentials. You must not impersonate other users or
          misrepresent your identity. Each user is permitted one account;
          creating multiple accounts to evade bans or restrictions is
          prohibited. You must be at least 13 years of age to use VibeGrom.
        </TermsSection>

        <TermsSection icon={Gavel} title="Enforcement">
          VibeGrom reserves the right to remove any content, suspend, or
          permanently ban accounts that violate these terms without prior
          notice. Appeals may be submitted through the Help section. VibeGrom is
          not liable for any loss of data, content, or access resulting from
          enforcement actions.
        </TermsSection>

        <TermsSection icon={FileCheck} title="Agreement">
          By continuing to use VibeGrom, you confirm that you have read,
          understood, and agree to these Terms and Conditions. These terms may
          be updated periodically, and continued use of the platform constitutes
          acceptance of the revised terms. Notifications of significant changes
          will be provided in the app.
        </TermsSection>

        {/* Footer */}
        <div className="text-center py-4 space-y-1">
          <p className="text-xs text-muted-foreground/60">
            © 2026 VibeGrom. All Rights Reserved.
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
