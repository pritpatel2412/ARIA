import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isPurple = theme === "purple";

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.92 }}
      title={isPurple ? "Switch to Dark (Green) theme" : "Switch to Purple theme"}
      className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-mono text-xs font-semibold transition-all duration-300 select-none"
      style={{
        background: isPurple ? "rgba(168,85,247,0.12)" : "rgba(0,255,136,0.08)",
        borderColor: isPurple ? "rgba(168,85,247,0.35)" : "rgba(0,255,136,0.25)",
        color: isPurple ? "#A855F7" : "#00FF88",
        boxShadow: isPurple ? "0 0 12px rgba(168,85,247,0.15)" : "0 0 8px rgba(0,255,136,0.1)",
      }}
    >
      {/* Track */}
      <div
        className="relative w-8 h-4.5 rounded-full transition-all duration-300 shrink-0"
        style={{
          width: "32px",
          height: "18px",
          background: isPurple
            ? "linear-gradient(135deg, #6B21A8, #A855F7)"
            : "linear-gradient(135deg, #064E3B, #00FF88)",
        }}
      >
        {/* Thumb */}
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 rounded-full"
          style={{
            width: "14px",
            height: "14px",
            left: isPurple ? "16px" : "2px",
            background: "#fff",
            boxShadow: isPurple ? "0 0 6px rgba(168,85,247,0.6)" : "0 0 6px rgba(0,255,136,0.5)",
          }}
        />
      </div>
      {/* Label */}
      <span className="text-[10px] leading-none hidden sm:block">
        {isPurple ? "Purple" : "Dark"}
      </span>
    </motion.button>
  );
}
