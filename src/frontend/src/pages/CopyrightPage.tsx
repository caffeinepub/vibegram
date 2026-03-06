import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Copyright } from "lucide-react";

export function CopyrightPage() {
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
          data-ocid="copyright.back.button"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold font-display">Copyright</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-[430px] w-full mx-auto">
        {/* Large copyright symbol */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
          style={{
            background: "oklch(0.62 0.22 295 / 0.15)",
            border: "1px solid oklch(0.62 0.22 295 / 0.3)",
          }}
        >
          <Copyright size={48} className="text-vibe-purple" />
        </div>

        {/* Copyright text */}
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl font-bold font-display gradient-text">
            © 2026 VibeGram
          </h2>
          <p className="text-base font-semibold text-foreground">
            All Rights Reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Developed by{" "}
            <span className="text-vibe-purple font-bold">Spandan</span>
          </p>
        </div>

        {/* Description card */}
        <div
          className="w-full rounded-2xl p-5 border border-border space-y-4"
          style={{ background: "oklch(0.07 0.005 270)" }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            All content, design, and code of VibeGram is protected by copyright
            law. Unauthorized reproduction, distribution, or modification of any
            part of this platform is strictly prohibited without prior written
            permission.
          </p>

          <div className="border-t border-border/60 pt-4 space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-vibe-purple mt-1.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                The VibeGram name, logo, and brand identity are trademarks of
                VibeGram.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-vibe-purple mt-1.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                User-generated content remains the property of its respective
                creators.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-vibe-purple mt-1.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Violations of copyright may result in account suspension and
                legal action.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-muted-foreground/60">
            Built with ❤️ on the Internet Computer
          </p>
        </div>
      </main>
    </div>
  );
}
