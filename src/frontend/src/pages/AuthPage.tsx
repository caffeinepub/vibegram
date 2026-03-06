import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Loader2, X } from "lucide-react";
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
  email?: string;
  phone?: string;
}

type LoginTab = "username" | "email" | "phone";

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

function findAccountByUsername(username: string): VGAccount | undefined {
  return getAccounts().find(
    (a) => a.username.toLowerCase() === username.toLowerCase(),
  );
}

function findAccountByEmail(email: string): VGAccount | undefined {
  return getAccounts().find(
    (a) => a.email?.toLowerCase() === email.toLowerCase(),
  );
}

function findAccountByPhone(phone: string): VGAccount | undefined {
  const normalized = phone.replace(/\s/g, "");
  return getAccounts().find((a) => a.phone?.replace(/\s/g, "") === normalized);
}

function updateAccountPassword(
  identifier: string,
  loginTab: LoginTab,
  newPassword: string,
) {
  const accounts = getAccounts();
  const idx = accounts.findIndex((a) => {
    if (loginTab === "username")
      return a.username.toLowerCase() === identifier.toLowerCase();
    if (loginTab === "email")
      return a.email?.toLowerCase() === identifier.toLowerCase();
    return a.phone?.replace(/\s/g, "") === identifier.replace(/\s/g, "");
  });
  if (idx !== -1) {
    accounts[idx].password = newPassword;
    localStorage.setItem("vg_accounts", JSON.stringify(accounts));
    return true;
  }
  return false;
}

function setSession(username: string) {
  localStorage.setItem("vg_session", JSON.stringify({ username }));
}

export function AuthPage({ needsProfile }: AuthPageProps) {
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const registerUser = useRegisterUser();
  const navigate = useNavigate();

  // Auth mode: "login" | "create_account" | "forgot_password"
  const [mode, setMode] = useState<
    "login" | "create_account" | "forgot_password"
  >("login");

  // Forgot password state
  const [fpStep, setFpStep] = useState<1 | 2 | 3>(1);
  const [fpOtpInput, setFpOtpInput] = useState("");
  const [fpOtpError, setFpOtpError] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpPasswordError, setFpPasswordError] = useState("");
  const [showFpNewPassword, setShowFpNewPassword] = useState(false);
  const [showFpConfirmPassword, setShowFpConfirmPassword] = useState(false);

  // Login tab
  const [loginTab, setLoginTab] = useState<LoginTab>("username");

  // Login fields
  const [loginInput, setLoginInput] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Create account fields
  const [fullName, setFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google OAuth simulation
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googlePickerOpen, setGooglePickerOpen] = useState(false);

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      setGooglePickerOpen(true);
    }, 1200);
  };

  const handleGoogleContinue = (email: string, name: string) => {
    const googleUsername = email
      .split("@")[0]
      .replace(/[^a-z0-9_]/gi, "_")
      .toLowerCase();
    const safeUsername = `g_${googleUsername}`.slice(0, 20);
    const googleAccount: VGAccount = {
      username: safeUsername,
      displayName: name,
      password: "google_auto_2026",
      email: email,
    };
    if (!findAccountByUsername(safeUsername)) {
      saveAccount(googleAccount);
    }
    setSession(safeUsername);
    login();
    toast.success(`Welcome, ${name}!`);
    setGooglePickerOpen(false);
    if (mode === "create_account") navigate({ to: "/discover" });
  };

  // Profile setup (after ICP login, if needsProfile)
  const [profileUsername, setProfileUsername] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const showRegistrationForm = !!identity && needsProfile;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginInput.trim() || !loginPassword.trim()) {
      setLoginError("Please enter your credentials and password.");
      return;
    }
    setIsSubmitting(true);
    try {
      let acc: VGAccount | undefined;
      if (loginTab === "username") {
        acc = findAccountByUsername(loginInput.trim());
        if (!acc) {
          setLoginError("No account found with this username.");
          return;
        }
      } else if (loginTab === "email") {
        acc = findAccountByEmail(loginInput.trim());
        if (!acc) {
          setLoginError("No account found with this email.");
          return;
        }
      } else {
        acc = findAccountByPhone(loginInput.trim());
        if (!acc) {
          setLoginError("No account found with this phone number.");
          return;
        }
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
      setSignupError("Please fill in name, username, and password fields.");
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
    if (findAccountByUsername(newUsername)) {
      setSignupError("This username is already taken. Try another.");
      return;
    }
    setIsSubmitting(true);
    try {
      saveAccount({
        username: newUsername,
        displayName: fullName.trim(),
        password: newPassword,
        email: newEmail.trim() || undefined,
        phone: newPhone.trim() || undefined,
      });
      setSession(newUsername);
      // Trigger ICP login for backend compatibility
      login();
      toast.success(`Account created! Welcome to VibeGrom, @${newUsername} 🎉`);
      // Navigate to discover people
      navigate({ to: "/discover" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    setFpStep(1);
    setFpOtpInput("");
    setFpOtpError("");
    setFpNewPassword("");
    setFpConfirmPassword("");
    setFpPasswordError("");
    setMode("forgot_password");
  };

  const handleSendOtp = () => {
    // Check if account exists
    let acc: VGAccount | undefined;
    if (loginTab === "username") {
      acc = findAccountByUsername(loginInput.trim());
    } else if (loginTab === "email") {
      acc = findAccountByEmail(loginInput.trim());
    } else {
      acc = findAccountByPhone(loginInput.trim());
    }
    if (!acc) {
      toast.error("No account found with this identifier.");
      setMode("login");
      return;
    }
    toast.success("OTP sent! Use 123456 for demo");
    setFpStep(2);
  };

  const handleVerifyOtp = () => {
    setFpOtpError("");
    if (fpOtpInput !== "123456") {
      setFpOtpError("Invalid OTP. Try again.");
      return;
    }
    setFpStep(3);
  };

  const handleUpdatePassword = () => {
    setFpPasswordError("");
    if (fpNewPassword.length < 6) {
      setFpPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpPasswordError("Passwords do not match.");
      return;
    }
    const updated = updateAccountPassword(
      loginInput.trim(),
      loginTab,
      fpNewPassword,
    );
    if (!updated) {
      setFpPasswordError("Account not found. Please try again.");
      return;
    }
    toast.success("Password updated! Please log in.");
    setMode("login");
    setLoginPassword("");
    setFpStep(1);
    setFpNewPassword("");
    setFpConfirmPassword("");
  };

  const handleCancelForgotPassword = () => {
    setMode("login");
    setFpStep(1);
    setFpOtpInput("");
    setFpOtpError("");
    setFpNewPassword("");
    setFpConfirmPassword("");
    setFpPasswordError("");
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
      toast.success("Welcome to VibeGrom! 🎉");
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
            VibeGrom
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
                {/* Login tab switcher */}
                <div
                  className="flex rounded-xl overflow-hidden mb-4 p-0.5"
                  style={{ background: "oklch(0.18 0.015 265)" }}
                >
                  {(["username", "email", "phone"] as LoginTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setLoginTab(tab);
                        setLoginInput("");
                        setLoginError("");
                      }}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={
                        loginTab === tab
                          ? {
                              background:
                                "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))",
                              color: "white",
                            }
                          : { color: "oklch(0.55 0.03 265)" }
                      }
                      data-ocid={`auth.login_tab.${tab}`}
                    >
                      {tab === "username"
                        ? "@Username"
                        : tab === "email"
                          ? "Email"
                          : "Phone"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                  {/* Dynamic input based on tab */}
                  <div
                    className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                    style={{
                      background: "oklch(0.18 0.015 265)",
                      borderColor: "oklch(0.25 0.02 280)",
                    }}
                  >
                    {loginTab === "username" && (
                      <span
                        className="text-sm font-semibold mr-1.5 select-none"
                        style={{ color: "oklch(0.62 0.28 340)" }}
                      >
                        @
                      </span>
                    )}
                    <Input
                      data-ocid="auth.login.input"
                      value={loginInput}
                      onChange={(e) => {
                        setLoginInput(
                          loginTab === "username"
                            ? e.target.value.toLowerCase()
                            : e.target.value,
                        );
                        setLoginError("");
                      }}
                      placeholder={
                        loginTab === "username"
                          ? "username"
                          : loginTab === "email"
                            ? "Email address"
                            : "+91 9876543210"
                      }
                      type={
                        loginTab === "email"
                          ? "email"
                          : loginTab === "phone"
                            ? "tel"
                            : "text"
                      }
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm"
                      autoComplete={
                        loginTab === "username"
                          ? "username"
                          : loginTab === "email"
                            ? "email"
                            : "tel"
                      }
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

                  {/* Forgot password link */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      data-ocid="auth.forgot_password.button"
                      className="text-xs font-semibold transition-colors"
                      style={{ color: "oklch(0.65 0.18 295)" }}
                    >
                      Forgot password?
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

                {/* Continue with Google */}
                <Button
                  type="button"
                  data-ocid="auth.google.button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full h-11 font-semibold text-sm border mb-2 flex items-center justify-center gap-2"
                  style={{
                    background: "oklch(0.97 0.005 265)",
                    color: "oklch(0.28 0.015 265)",
                    borderColor: "oklch(0.82 0.01 265)",
                  }}
                >
                  {googleLoading ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                      style={{ color: "oklch(0.55 0.2 25)" }}
                    />
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="Google"
                    >
                      <title>Google</title>
                      <path
                        d="M43.611 20.083H42V20H24v8h11.303C33.868 32.643 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L37.424 9.576C34.046 6.481 29.268 4.5 24 4.5 12.954 4.5 4 13.454 4 24.5S12.954 44.5 24 44.5c10.761 0 19.5-8.739 19.5-19.5 0-1.307-.13-2.584-.389-3.817z"
                        fill="#FFC107"
                      />
                      <path
                        d="M6.306 14.691L12.876 19.51C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039L37.424 9.576C34.046 6.481 29.268 4.5 24 4.5c-7.736 0-14.43 4.42-17.694 10.191z"
                        fill="#FF3D00"
                      />
                      <path
                        d="M24 44.5c5.166 0 9.86-1.977 13.409-5.192L31.219 34.63C29.211 36.065 26.715 37 24 37c-5.311 0-9.832-3.337-11.288-7.938l-6.522 5.025C9.505 39.998 16.227 44.5 24 44.5z"
                        fill="#4CAF50"
                      />
                      <path
                        d="M43.611 20.083H42V20H24v8h11.303c-.709 2.054-2.034 3.827-3.715 5.119l.002-.001 6.19 5.678C37.548 38.17 43.5 34 43.5 24.5c0-1.307-.13-2.584-.389-3.817z"
                        fill="#1976D2"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>

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
                By continuing, you agree to VibeGrom's{" "}
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
          ) : mode === "forgot_password" ? (
            /* FORGOT PASSWORD MODE */
            <motion.div
              key="forgot_password"
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
                data-ocid="auth.forgot_password.dialog"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <button
                    type="button"
                    onClick={handleCancelForgotPassword}
                    data-ocid="auth.forgot_password.cancel_button"
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-secondary/60"
                    style={{ color: "oklch(0.6 0.04 265)" }}
                    aria-label="Back to login"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold font-display text-white">
                      Reset Password
                    </h2>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.55 0.03 265)" }}
                    >
                      Step {fpStep} of 3
                    </p>
                  </div>
                </div>

                {/* Step indicator */}
                <div className="flex gap-1.5 mb-6">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className="flex-1 h-1 rounded-full transition-all"
                      style={{
                        background:
                          s <= fpStep
                            ? "linear-gradient(90deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350))"
                            : "oklch(0.22 0.015 280)",
                      }}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {fpStep === 1 && (
                    <motion.div
                      key="fp-step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">
                          Verify your identity
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "oklch(0.55 0.03 265)" }}
                        >
                          We'll send a verification code to your registered{" "}
                          {loginTab === "phone"
                            ? "phone number"
                            : loginTab === "email"
                              ? "email"
                              : "email/phone"}
                          .
                        </p>
                      </div>

                      {/* Read-only identifier */}
                      <div
                        className="flex items-center rounded-xl border px-3 h-11"
                        style={{
                          background: "oklch(0.15 0.012 265)",
                          borderColor: "oklch(0.22 0.02 280)",
                        }}
                      >
                        {loginTab === "username" && (
                          <span
                            className="text-sm font-semibold mr-1.5 select-none"
                            style={{ color: "oklch(0.62 0.28 340)" }}
                          >
                            @
                          </span>
                        )}
                        <span className="text-sm text-white/70 select-none">
                          {loginInput ||
                            "(empty — go back and enter your info)"}
                        </span>
                      </div>

                      <Button
                        type="button"
                        data-ocid="auth.forgot_password.send_otp.button"
                        onClick={handleSendOtp}
                        disabled={!loginInput.trim()}
                        className="w-full btn-hotpink border-0 font-bold h-11 text-sm"
                      >
                        Send OTP
                      </Button>
                    </motion.div>
                  )}

                  {fpStep === 2 && (
                    <motion.div
                      key="fp-step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">
                          Enter OTP
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "oklch(0.55 0.03 265)" }}
                        >
                          Enter the 6-digit code sent to your account
                        </p>
                      </div>

                      <div
                        className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                        style={{
                          background: "oklch(0.18 0.015 265)",
                          borderColor: fpOtpError
                            ? "oklch(0.6 0.22 25)"
                            : "oklch(0.25 0.02 280)",
                        }}
                      >
                        <Input
                          data-ocid="auth.forgot_password.otp.input"
                          value={fpOtpInput}
                          onChange={(e) => {
                            setFpOtpInput(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            );
                            setFpOtpError("");
                          }}
                          placeholder="123456"
                          maxLength={6}
                          inputMode="numeric"
                          className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-base font-mono tracking-[0.25em] text-center"
                        />
                      </div>

                      <AnimatePresence>
                        {fpOtpError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs px-1"
                            style={{ color: "oklch(0.7 0.22 25)" }}
                            data-ocid="auth.forgot_password.otp.error_state"
                          >
                            {fpOtpError}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <Button
                        type="button"
                        data-ocid="auth.forgot_password.verify_otp.button"
                        onClick={handleVerifyOtp}
                        disabled={fpOtpInput.length !== 6}
                        className="w-full btn-hotpink border-0 font-bold h-11 text-sm"
                      >
                        Verify OTP
                      </Button>
                    </motion.div>
                  )}

                  {fpStep === 3 && (
                    <motion.div
                      key="fp-step3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">
                          Create new password
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "oklch(0.55 0.03 265)" }}
                        >
                          Your username will stay the same. Only password will
                          change.
                        </p>
                      </div>

                      {/* New password */}
                      <div
                        className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                        style={{
                          background: "oklch(0.18 0.015 265)",
                          borderColor: "oklch(0.25 0.02 280)",
                        }}
                      >
                        <Input
                          data-ocid="auth.forgot_password.new_password.input"
                          type={showFpNewPassword ? "text" : "password"}
                          value={fpNewPassword}
                          onChange={(e) => {
                            setFpNewPassword(e.target.value);
                            setFpPasswordError("");
                          }}
                          placeholder="New password"
                          className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm flex-1"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowFpNewPassword((v) => !v)}
                          className="ml-2 transition-colors"
                          style={{ color: "oklch(0.55 0.04 265)" }}
                        >
                          {showFpNewPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>

                      {/* Confirm password */}
                      <div
                        className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                        style={{
                          background: "oklch(0.18 0.015 265)",
                          borderColor: "oklch(0.25 0.02 280)",
                        }}
                      >
                        <Input
                          data-ocid="auth.forgot_password.confirm_password.input"
                          type={showFpConfirmPassword ? "text" : "password"}
                          value={fpConfirmPassword}
                          onChange={(e) => {
                            setFpConfirmPassword(e.target.value);
                            setFpPasswordError("");
                          }}
                          placeholder="Confirm new password"
                          className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm flex-1"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowFpConfirmPassword((v) => !v)}
                          className="ml-2 transition-colors"
                          style={{ color: "oklch(0.55 0.04 265)" }}
                        >
                          {showFpConfirmPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>

                      <AnimatePresence>
                        {fpPasswordError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs px-1"
                            style={{ color: "oklch(0.7 0.22 25)" }}
                            data-ocid="auth.forgot_password.password.error_state"
                          >
                            {fpPasswordError}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <Button
                        type="button"
                        data-ocid="auth.forgot_password.update_password.button"
                        onClick={handleUpdatePassword}
                        disabled={!fpNewPassword || !fpConfirmPassword}
                        className="w-full btn-hotpink border-0 font-bold h-11 text-sm"
                      >
                        Update Password
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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

                  {/* Email (optional) */}
                  <div
                    className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                    style={{
                      background: "oklch(0.18 0.015 265)",
                      borderColor: "oklch(0.25 0.02 280)",
                    }}
                  >
                    <Input
                      data-ocid="auth.email.input"
                      type="email"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setSignupError("");
                      }}
                      placeholder="Email address (optional)"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm"
                      autoComplete="email"
                    />
                  </div>

                  {/* Phone (optional) */}
                  <div
                    className="flex items-center rounded-xl border px-3 h-12 transition-all focus-within:ring-1"
                    style={{
                      background: "oklch(0.18 0.015 265)",
                      borderColor: "oklch(0.25 0.02 280)",
                    }}
                  >
                    <Input
                      data-ocid="auth.phone.input"
                      type="tel"
                      value={newPhone}
                      onChange={(e) => {
                        setNewPhone(e.target.value);
                        setSignupError("");
                      }}
                      placeholder="Phone number (optional)"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-white placeholder:text-white/30 text-sm"
                      autoComplete="tel"
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

                  {/* Divider */}
                  <div className="flex items-center gap-3 pt-1">
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

                  {/* Continue with Google */}
                  <Button
                    type="button"
                    data-ocid="auth.google.button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    className="w-full h-11 font-semibold text-sm border flex items-center justify-center gap-2"
                    style={{
                      background: "oklch(0.97 0.005 265)",
                      color: "oklch(0.28 0.015 265)",
                      borderColor: "oklch(0.82 0.01 265)",
                    }}
                  >
                    {googleLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                        style={{ color: "oklch(0.55 0.2 25)" }}
                      />
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-label="Google"
                      >
                        <title>Google</title>
                        <path
                          d="M43.611 20.083H42V20H24v8h11.303C33.868 32.643 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L37.424 9.576C34.046 6.481 29.268 4.5 24 4.5 12.954 4.5 4 13.454 4 24.5S12.954 44.5 24 44.5c10.761 0 19.5-8.739 19.5-19.5 0-1.307-.13-2.584-.389-3.817z"
                          fill="#FFC107"
                        />
                        <path
                          d="M6.306 14.691L12.876 19.51C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039L37.424 9.576C34.046 6.481 29.268 4.5 24 4.5c-7.736 0-14.43 4.42-17.694 10.191z"
                          fill="#FF3D00"
                        />
                        <path
                          d="M24 44.5c5.166 0 9.86-1.977 13.409-5.192L31.219 34.63C29.211 36.065 26.715 37 24 37c-5.311 0-9.832-3.337-11.288-7.938l-6.522 5.025C9.505 39.998 16.227 44.5 24 44.5z"
                          fill="#4CAF50"
                        />
                        <path
                          d="M43.611 20.083H42V20H24v8h11.303c-.709 2.054-2.034 3.827-3.715 5.119l.002-.001 6.19 5.678C37.548 38.17 43.5 34 43.5 24.5c0-1.307-.13-2.584-.389-3.817z"
                          fill="#1976D2"
                        />
                      </svg>
                    )}
                    Continue with Google
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
                By signing up, you agree to VibeGrom's{" "}
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

      {/* Google Account Picker Dialog */}
      <Dialog open={googlePickerOpen} onOpenChange={setGooglePickerOpen}>
        <DialogContent
          className="p-0 overflow-hidden max-w-sm border-0 rounded-2xl"
          style={{ background: "oklch(0.98 0.005 265)" }}
          data-ocid="auth.google.dialog"
        >
          {/* Google header */}
          <div
            className="px-5 pt-5 pb-4 border-b"
            style={{ borderColor: "oklch(0.88 0.01 265)" }}
          >
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Google"
                  >
                    <title>Google</title>
                    <path
                      d="M43.611 20.083H42V20H24v8h11.303C33.868 32.643 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L37.424 9.576C34.046 6.481 29.268 4.5 24 4.5 12.954 4.5 4 13.454 4 24.5S12.954 44.5 24 44.5c10.761 0 19.5-8.739 19.5-19.5 0-1.307-.13-2.584-.389-3.817z"
                      fill="#FFC107"
                    />
                    <path
                      d="M6.306 14.691L12.876 19.51C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039L37.424 9.576C34.046 6.481 29.268 4.5 24 4.5c-7.736 0-14.43 4.42-17.694 10.191z"
                      fill="#FF3D00"
                    />
                    <path
                      d="M24 44.5c5.166 0 9.86-1.977 13.409-5.192L31.219 34.63C29.211 36.065 26.715 37 24 37c-5.311 0-9.832-3.337-11.288-7.938l-6.522 5.025C9.505 39.998 16.227 44.5 24 44.5z"
                      fill="#4CAF50"
                    />
                    <path
                      d="M43.611 20.083H42V20H24v8h11.303c-.709 2.054-2.034 3.827-3.715 5.119l.002-.001 6.19 5.678C37.548 38.17 43.5 34 43.5 24.5c0-1.307-.13-2.584-.389-3.817z"
                      fill="#1976D2"
                    />
                  </svg>
                  <DialogTitle
                    className="font-bold text-base"
                    style={{ color: "oklch(0.25 0.015 265)" }}
                  >
                    Choose an account
                  </DialogTitle>
                </div>
                <button
                  type="button"
                  onClick={() => setGooglePickerOpen(false)}
                  className="transition-colors"
                  style={{ color: "oklch(0.5 0.03 265)" }}
                  aria-label="Close"
                  data-ocid="auth.google.close_button"
                >
                  <X size={18} />
                </button>
              </div>
              <p
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.5 0.03 265)" }}
              >
                to continue to VibeGrom
              </p>
            </DialogHeader>
          </div>

          {/* Google accounts list */}
          <div className="p-3 space-y-1">
            {[
              {
                name: "Spandan Kumar",
                email: "spandan@gmail.com",
                initials: "S",
                color: "oklch(0.55 0.22 25)",
              },
              {
                name: "Demo User",
                email: "demo.user@gmail.com",
                initials: "D",
                color: "oklch(0.55 0.2 250)",
              },
              {
                name: "VibeGrom User",
                email: "vibegrom.user@gmail.com",
                initials: "V",
                color: "oklch(0.5 0.22 295)",
              },
            ].map((acc) => (
              <button
                key={acc.email}
                type="button"
                data-ocid="auth.google.account.button"
                onClick={() => handleGoogleContinue(acc.email, acc.name)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-black/5"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                  style={{ background: acc.color }}
                >
                  {acc.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "oklch(0.25 0.015 265)" }}
                  >
                    {acc.name}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "oklch(0.5 0.03 265)" }}
                  >
                    {acc.email}
                  </p>
                </div>
              </button>
            ))}

            <div
              className="border-t pt-2 mt-1"
              style={{ borderColor: "oklch(0.88 0.01 265)" }}
            >
              <button
                type="button"
                data-ocid="auth.google.add_account.button"
                onClick={() =>
                  toast.info(
                    "Sign in with your Google account in a real browser",
                  )
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-black/5"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2"
                  style={{
                    borderColor: "oklch(0.7 0.03 265)",
                    color: "oklch(0.45 0.03 265)",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-label="Add account"
                  >
                    <title>Add account</title>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.35 0.02 265)" }}
                >
                  Use another account
                </p>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
