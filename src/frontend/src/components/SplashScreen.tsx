import { motion } from "motion/react";

export function SplashScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.18 0.025 295), oklch(0.16 0.022 340), oklch(0.15 0.02 225))",
      }}
    >
      {/* Ambient glow blobs */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "oklch(0.62 0.22 295)" }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "oklch(0.65 0.25 350)" }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "oklch(0.6 0.2 225)" }}
      />

      {/* Logo container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center gap-5"
      >
        {/* Logo - user uploaded app icon */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-3xl blur-xl opacity-40"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.22 295), oklch(0.65 0.25 350), oklch(0.6 0.2 225))",
            }}
          />
          <img
            src="/assets/uploads/InShot_20260306_023848346-1.png"
            alt="VibeGram"
            className="h-28 w-28 rounded-3xl object-cover relative shadow-glow"
          />
        </div>

        {/* App name */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center"
        >
          <h1
            className="text-4xl font-bold font-display"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.88 0.18 295), oklch(0.88 0.2 350), oklch(0.82 0.18 225))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            VibeGram
          </h1>
          <p className="text-sm text-white/50 mt-1.5 font-body">
            Share your vibe with the world
          </p>
        </motion.div>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-16 flex items-center gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
            className="w-2 h-2 rounded-full"
            style={{
              background:
                i === 0
                  ? "oklch(0.75 0.22 295)"
                  : i === 1
                    ? "oklch(0.75 0.25 350)"
                    : "oklch(0.7 0.2 225)",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
