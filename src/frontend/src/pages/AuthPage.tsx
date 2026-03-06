import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegisterUser } from "../hooks/useQueries";

interface AuthPageProps {
  needsProfile: boolean;
}

interface VGAccount {
  username: string;
  displayName: string;
  password: string;
}

function getAccounts(): VGAccount[] {
  try {
    return JSON.parse(localStorage.getItem("vg_accounts") || "[]");
  } catch {
    return [];
  }
}

function saveAccount(acc: VGAccount) {
  const accounts = getAccounts();
  accounts.push(acc);
  localStorage.setItem("vg_accounts", JSON.stringify(accounts));
}

function findAccount(username: string): VGAccount | undefined {
  return getAccounts().find(
    (a) => a.username.toLowerCase() === username.toLowerCase(),
  );
}

function setSession(username: string) {
  localStorage.setItem("vg_session", JSON.stringify({ username }));
}

export function AuthPage({ needsProfile }: AuthPageProps) {
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const registerUser = useRegisterUser();

  // Auth mode: "login" | "create_account"
  const [mode, setMode] = useState<"login" | "create_account">("login");

  // Login fields
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Create account fields
  const [fullName, setFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile setup (after ICP login, if needsProfile)
  const [profileUsername, setProfileUsername] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const showRegistrationForm = !!identity && needsProfile;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError("Please enter your username and password.");
      return;
    }
    setIsSubmitting(true);
    try {
      const acc = findAccount(loginUsername.trim());
      if (!acc) {
        setLoginError("No account found with this username.");
        return;
      }
      if (acc.password !== loginPassword) {
        setLoginError("Incorrect password. Please try again.");
        return;
      }
      setSession(acc.username);
      // Trigger ICP login for backend compatibility
      login();
      toast.success(`Welcome back, @${acc.username}! 🎉`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    if (
      !fullName.trim() ||
      !newUsername.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      setSignupError("Please fill in all fields.");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
      setSignupError(
        "Username must be 3-20 chars: lowercase letters, numbers, underscores.",
      );
      return;
    }
    if (newPassword.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }
    if (findAccount(newUsername)) {
      setSignupError("This username is already taken. Try another.");
      return;
    }
    setIsSubmitting(true);
    try {
      saveAccount({
        username: newUsername,
        displayName: fullName.trim(),
        password: newPassword,
      });
      setSession(newUsername);
      // Trigger ICP login for backend compatibility
      login();
      toast.success(`Account created! Welcome to VibeGram, @${newUsername} 🎉`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUsername.trim() || !profileDisplayName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(profileUsername)) {
      toast.error(
        "Username must be 3-20 characters, lowercase letters, numbers, or underscores",
      );
      return;
    }
    setIsRegistering(true);
    try {
      await registerUser.mutateAsync({
        username: profileUsername,
        displayName: profileDisplayName,
      });
      toast.success("Welcome to VibeGram! 🎉");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(
        error?.message || "Registration failed. Try a different username.",
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative"
      style={{ background: "oklch(0.08 0.015 265)" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.62 0.28 340)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-18 blur-3xl"
          style={{ background: "oklch(0.55 0.22 295)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-8 blur-3xl"
          style={{ background: "oklch(0.45 0.15 265)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative"
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-4xl font-bold font-display gradient-text"
          >
            VibeGram
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-sm mt-1.5"
            style={{ color: "oklch(0.6 0.04 265)" }}
          >
            Share your world, one vibe at a time
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {showRegistrationForm ? (
            /* Profile setup after ICP login */
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
                  background: "oklch(0.13 0.012 260 / 0.9)",
                  border: "1px solid oklch(0.22 0.02 280 / 0.6)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                }}
              >
                <h2 className="text-xl font-bold font-display mb-1 text-white">
                  Set up your profile
                </h2>
                <p
                  className="text-sm mb-6"
                  style={{ color: "oklch(0.6 0.04 265)" }}
                >
                  Choose a username to get started
                </p>

                <form onSubmit={handleRegisterProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <div
                      className="flex items-center rounded-xl border px-3 h-11 transition-all focus-within:ring-1"
                      style={{
                        background: "oklch(0.18 0.015 265)",
                        borderColor: "oklch(0.25 0.02 280)",
                      }}
                    >
                      <Input
                        value={profileDisplayName}
                        onChange={(e) => setProfileDisplayName(e.target.value)}
                        placeholder="Display Name"
                        className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm"
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div
                      className="flex items-center rounded-xl border px-3 h-11 transition-all focus-within:ring-1"
                      style={{
                        background: "oklch(0.18 0.015 265)",
                        borderColor: "oklch(0.25 0.02 280)",
                      }}
                    >
                      <span
                        className="text-sm font-medium mr-1"
                        style={{ color: "oklch(0.62 0.28 340)" }}
                      >
                        @
                      </span>
                      <Input
                        data-ocid="auth.username.input"
                        value={profileUsername}
                        onChange={(e) =>
                          setProfileUsername(e.target.value.toLowerCase())
                        }
                        placeholder="username"
                        className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm"
                        autoComplete="username"
                      />
                    </div>
                    <p
                      className="text-xs px-1"
                      style={{ color: "oklch(0.5 0.03 265)" }}
                    >
                      3-20 chars: lowercase letters, numbers, underscores
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-hotpink border-0 font-semibold h-11 text-sm tracking-wide"
                    disabled={
                      isRegistering || !profileUsername || !profileDisplayName
                    }
                  >
                    {isRegistering ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : null}
                    Create Profile
                  </Button>
                </form>
              </div>
            </motion.div>
          ) : mode === "login" ? (
            /* LOGIN MODE */
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="rounded-2xl p-6 shadow-glass"
                style={{
                  background: "oklch(0.13 0.012 260 / 0.9)",
                  border: "1px solid oklch(0.22 0.02 280 / 0.6)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                }}
              >
                <form onSubmit={handleLogin} className="space-y-3">
                  {/* Username input */}
                  <div
                    className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                    style={{
                      background: "oklch(0.18 0.015 265)",
                      borderColor: "oklch(0.25 0.02 280)",
                    }}
                  >
                    <span
                      className="text-sm font-semibold mr-1.5 select-none"
                      style={{ color: "oklch(0.62 0.28 340)" }}
                    >
                      @
                    </span>
                    <Input
                      data-ocid="auth.username.input"
                      value={loginUsername}
                      onChange={(e) => {
                        setLoginUsername(e.target.value.toLowerCase());
                        setLoginError("");
                      }}
                      placeholder="username"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm"
                      autoComplete="username"
                      autoCapitalize="none"
                    />
                  </div>

                  {/* Password input */}
                  <div
                    className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                    style={{
                      background: "oklch(0.18 0.015 265)",
                      borderColor: "oklch(0.25 0.02 280)",
                    }}
                  >
                    <Input
                      data-ocid="auth.password.input"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError("");
                      }}
                      placeholder="apna password"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm flex-1"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="ml-2 transition-colors"
                      style={{ color: "oklch(0.55 0.04 265)" }}
                    >
                      {showLoginPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>

                  {/* Inline error */}
                  <AnimatePresence>
                    {loginError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs px-1"
                        style={{ color: "oklch(0.7 0.22 25)" }}
                        data-ocid="auth.error_state"
                      >
                        {loginError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Login button */}
                  <Button
                    type="submit"
                    data-ocid="auth.login.button"
                    className="w-full btn-hotpink border-0 font-bold h-12 text-sm tracking-widest uppercase mt-1"
                    disabled={isSubmitting || isLoggingIn}
                  >
                    {isSubmitting || isLoggingIn ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : null}
                    Login
                  </Button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div
                    className="flex-1 h-px"
                    style={{ background: "oklch(0.25 0.02 280)" }}
                  />
                  <span
                    className="text-xs font-semibold tracking-widest"
                    style={{ color: "oklch(0.45 0.03 265)" }}
                  >
                    OR
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "oklch(0.25 0.02 280)" }}
                  />
                </div>

                {/* Create new account */}
                <Button
                  type="button"
                  data-ocid="auth.create_account.button"
                  onClick={() => {
                    setMode("create_account");
                    setLoginError("");
                  }}
                  variant="outline"
                  className="w-full h-11 font-semibold text-sm border"
                  style={{
                    borderColor: "oklch(0.62 0.28 340)",
                    color: "oklch(0.78 0.22 340)",
                    background: "transparent",
                  }}
                >
                  Create New Account
                </Button>
              </div>

              <p
                className="text-center text-xs mt-5 px-4"
                style={{ color: "oklch(0.45 0.03 265)" }}
              >
                By continuing, you agree to VibeGram's{" "}
                <span
                  className="underline cursor-pointer"
                  style={{ color: "oklch(0.6 0.04 265)" }}
                >
                  Terms
                </span>{" "}
                &{" "}
                <span
                  className="underline cursor-pointer"
                  style={{ color: "oklch(0.6 0.04 265)" }}
                >
                  Privacy Policy
                </span>
              </p>
            </motion.div>
          ) : (
            /* CREATE ACCOUNT MODE */
            <motion.div
              key="create_account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="rounded-2xl p-6 shadow-glass"
                style={{
                  background: "oklch(0.13 0.012 260 / 0.9)",
                  border: "1px solid oklch(0.22 0.02 280 / 0.6)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                }}
              >
                <h2
                  className="text-xl font-bold font-display mb-5 text-center"
                  style={{ color: "oklch(0.9 0.04 265)" }}
                >
                  Create Account
                </h2>

                <form onSubmit={handleCreateAccount} className="space-y-3">
                  {/* Full Name */}
                  <div
                    className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                    style={{
                      background: "oklch(0.18 0.015 265)",
                      borderColor: "oklch(0.25 0.02 280)",
                    }}
                  >
                    <Input
                      data-ocid="auth.fullname.input"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setSignupError("");
                      }}
                      placeholder="Full Name"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm"
                      autoComplete="name"
                    />
                  </div>

                  {/* Username */}
                  <div
                    className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                    style={{
                      background: "oklch(0.18 0.015 265)",
                      borderColor: "oklch(0.25 0.02 280)",
                    }}
                  >
                    <span
                      className="text-sm font-semibold mr-1.5 select-none"
                      style={{ color: "oklch(0.62 0.28 340)" }}
                    >
                      @
                    </span>
                    <Input
                      data-ocid="auth.username.input"
                      value={newUsername}
                      onChange={(e) => {
                        setNewUsername(e.target.value.toLowerCase());
                        setSignupError("");
                      }}
                      placeholder="username"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm"
                      autoComplete="username"
                      autoCapitalize="none"
                    />
                  </div>

                  {/* Password */}
                  <div
                    className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                    style={{
                      background: "oklch(0.18 0.015 265)",
                      borderColor: "oklch(0.25 0.02 280)",
                    }}
                  >
                    <Input
                      data-ocid="auth.password.input"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setSignupError("");
                      }}
                      placeholder="Password"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm flex-1"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="ml-2 transition-colors"
                      style={{ color: "oklch(0.55 0.04 265)" }}
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div
                    className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                    style={{
                      background: "oklch(0.18 0.015 265)",
                      borderColor: "oklch(0.25 0.02 280)",
                    }}
                  >
                    <Input
                      data-ocid="auth.confirm_password.input"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setSignupError("");
                      }}
                      placeholder="Confirm Password"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm flex-1"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="ml-2 transition-colors"
                      style={{ color: "oklch(0.55 0.04 265)" }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>

                  {/* Inline error */}
                  <AnimatePresence>
                    {signupError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs px-1"
                        style={{ color: "oklch(0.7 0.22 25)" }}
                        data-ocid="auth.error_state"
                      >
                        {signupError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Sign Up button */}
                  <Button
                    type="submit"
                    data-ocid="auth.signup.submit.button"
                    className="w-full btn-hotpink border-0 font-bold h-12 text-sm tracking-widest uppercase mt-1"
                    disabled={
                      isSubmitting ||
                      isLoggingIn ||
                      !fullName ||
                      !newUsername ||
                      !newPassword ||
                      !confirmPassword
                    }
                  >
                    {isSubmitting || isLoggingIn ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : null}
                    Sign Up
                  </Button>
                </form>
              </div>

              {/* Switch to login */}
              <div
                className="mt-4 py-4 rounded-2xl text-center text-sm"
                style={{
                  background: "oklch(0.13 0.012 260 / 0.7)",
                  border: "1px solid oklch(0.22 0.02 280 / 0.5)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <span style={{ color: "oklch(0.55 0.03 265)" }}>
                  Already have an account?{" "}
                </span>
                <button
                  type="button"
                  data-ocid="auth.switch_to_login.link"
                  onClick={() => {
                    setMode("login");
                    setSignupError("");
                  }}
                  className="font-bold transition-colors"
                  style={{ color: "oklch(0.78 0.22 340)" }}
                >
                  Log in
                </button>
              </div>

              <p
                className="text-center text-xs mt-4 px-4"
                style={{ color: "oklch(0.45 0.03 265)" }}
              >
                By signing up, you agree to VibeGram's{" "}
                <span
                  className="underline cursor-pointer"
                  style={{ color: "oklch(0.6 0.04 265)" }}
                >
                  Terms
                </span>{" "}
                &{" "}
                <span
                  className="underline cursor-pointer"
                  style={{ color: "oklch(0.6 0.04 265)" }}
                >
                  Privacy Policy
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
