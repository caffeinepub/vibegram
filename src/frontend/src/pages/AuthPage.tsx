import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegisterUser } from "../hooks/useQueries";

interface AuthPageProps {
  needsProfile: boolean;
}

export function AuthPage({ needsProfile }: AuthPageProps) {
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const registerUser = useRegisterUser();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is authenticated but has no profile yet, show the registration form
  const showRegistrationForm = !!identity && needsProfile;

  const handleLogin = () => {
    login();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      toast.error(
        "Username must be 3-20 characters, lowercase letters, numbers, or underscores",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await registerUser.mutateAsync({ username, displayName });
      toast.success("Welcome to VibeGram! 🎉");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(
        error?.message || "Registration failed. Try a different username.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative"
      style={{ background: "oklch(0.1 0.018 265)" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-right: hot-pink/magenta glow */}
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "oklch(0.62 0.28 340)" }}
        />
        {/* Bottom-left: indigo/purple glow */}
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.55 0.22 295)" }}
        />
        {/* Center subtle: deep blue tint */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{ background: "oklch(0.45 0.15 265)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-4"
          >
            <img
              src="/assets/generated/vibegram-logo-transparent.dim_120x120.png"
              alt="VibeGram"
              className="h-20 w-20 rounded-2xl shadow-glow"
            />
          </motion.div>
          <h1 className="text-4xl font-bold font-display gradient-text">
            VibeGram
          </h1>
          <p className="text-muted-foreground text-sm mt-2 text-center">
            Share your world, one vibe at a time
          </p>
        </div>

        <AnimatePresence mode="wait">
          {showRegistrationForm ? (
            /* Registration form (after login, no profile) */
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="rounded-2xl p-6 shadow-glass"
                style={{
                  background: "oklch(0.15 0.01 260 / 0.85)",
                  border: "1px solid oklch(0.25 0.02 280)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                <h2 className="text-xl font-bold font-display mb-1">
                  Set up your profile
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose a username to get started
                </p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="displayName"
                      className="text-sm font-medium"
                    >
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="bg-secondary border-border"
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        @
                      </span>
                      <Input
                        id="username"
                        data-ocid="auth.username.input"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.toLowerCase())
                        }
                        placeholder="yourhandle"
                        className="bg-secondary border-border pl-7"
                        autoComplete="username"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      3-20 chars, lowercase letters, numbers, underscores
                    </p>
                  </div>

                  <Button
                    type="submit"
                    data-ocid="auth.signup.button"
                    className="w-full btn-hotpink border-0 font-semibold h-11"
                    disabled={isSubmitting || !username || !displayName}
                  >
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin mr-2" />
                    ) : null}
                    Create Profile
                  </Button>
                </form>
              </div>
            </motion.div>
          ) : (
            /* Login / Signup toggle */
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="rounded-2xl p-6 shadow-glass"
                style={{
                  background: "oklch(0.15 0.01 260 / 0.85)",
                  border: "1px solid oklch(0.25 0.02 280)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                {/* Mode toggle */}
                <div
                  className="flex rounded-xl p-1 mb-6"
                  style={{ background: "oklch(0.2 0.015 270)" }}
                >
                  <button
                    type="button"
                    data-ocid="auth.login.tab"
                    onClick={() => setMode("login")}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      mode === "login"
                        ? "text-white shadow-xs"
                        : "text-muted-foreground"
                    }`}
                    style={
                      mode === "login"
                        ? { background: "oklch(0.62 0.28 340)" }
                        : {}
                    }
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    data-ocid="auth.signup.tab"
                    onClick={() => setMode("signup")}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      mode === "signup"
                        ? "text-white shadow-xs"
                        : "text-muted-foreground"
                    }`}
                    style={
                      mode === "signup"
                        ? { background: "oklch(0.62 0.28 340)" }
                        : {}
                    }
                  >
                    Sign Up
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {mode === "login" ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <p className="text-sm text-muted-foreground text-center">
                        Sign in securely using Internet Identity — no password
                        needed.
                      </p>
                      <Button
                        data-ocid="auth.login.button"
                        onClick={handleLogin}
                        className="w-full btn-hotpink border-0 font-semibold h-11 text-base"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <Loader2 size={18} className="animate-spin mr-2" />
                        ) : null}
                        {isLoggingIn ? "Connecting..." : "Log In"}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <p className="text-sm text-muted-foreground text-center">
                        Create your VibeGram account in seconds. Secure,
                        private, decentralized.
                      </p>
                      <Button
                        data-ocid="auth.signup.button"
                        onClick={handleLogin}
                        className="w-full btn-hotpink border-0 font-semibold h-11 text-base"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <Loader2 size={18} className="animate-spin mr-2" />
                        ) : null}
                        {isLoggingIn ? "Connecting..." : "Get Started"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-6 px-4">
                By continuing, you agree to VibeGram's Terms of Service and
                Privacy Policy
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
