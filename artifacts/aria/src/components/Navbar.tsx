import { Link, useLocation } from "wouter";
import { useUser } from "@/lib/useUser";
import { loginUrl } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Zap, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";

function TinyFishBadge() {
  return (
    <motion.a
      href="https://tinyfish.ai"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      whileHover={{ scale: 1.05, boxShadow: "0 0 16px rgba(34,211,238,0.3)" }}
      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold cursor-pointer transition-all"
      style={{
        background: "linear-gradient(135deg, rgba(34,211,238,0.10), rgba(6,182,212,0.04))",
        border: "1px solid rgba(34,211,238,0.30)",
        color: "#22D3EE",
      }}
    >
      <span className="text-sm leading-none">🐟</span>
      Powered by TinyFish
    </motion.a>
  );
}

export function Navbar() {
  const { user, loading, logout } = useUser();
  const { colors } = useTheme();
  const [loc] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isApp = loc.startsWith("/app");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [profileOpen]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? colors.navBgScrolled : colors.navBgTop,
        backdropFilter: "blur(16px)",
        borderBottom: scrolled ? `1px solid ${colors.border}` : "1px solid transparent",
        boxShadow: scrolled ? "0 1px 40px rgba(0,0,0,0.4)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + TinyFish badge */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <motion.div
                className="flex items-center gap-2 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: `rgba(${colors.primaryRgb},0.10)`,
                    border: `1px solid rgba(${colors.primaryRgb},0.30)`,
                  }}
                  whileHover={{
                    background: `rgba(${colors.primaryRgb},0.20)`,
                    boxShadow: `0 0 12px rgba(${colors.primaryRgb},0.30)`,
                  }}
                >
                  <Zap className="w-4 h-4" style={{ color: colors.primary }} />
                </motion.div>
                <span className="font-mono font-bold text-[#F8FAFC] text-lg tracking-tight">ARIA</span>
              </motion.div>
            </Link>
            <TinyFishBadge />
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {!isApp && (
              <>
                <NavLink href="/pricing">Pricing</NavLink>
                <NavLink href="/about">About</NavLink>
              </>
            )}

            {/* Theme toggle */}
            <ThemeToggle />

            {!loading && (
              user ? (
                <div className="flex items-center gap-3">
                  <Link href="/app">
                    <motion.span
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="text-sm font-mono px-3 py-1.5 rounded-lg cursor-pointer transition-colors block"
                      style={{
                        background: `rgba(${colors.primaryRgb},0.10)`,
                        border: `1px solid rgba(${colors.primaryRgb},0.30)`,
                        color: colors.primary,
                      }}
                    >
                      Dashboard
                    </motion.span>
                  </Link>
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center gap-2 focus:outline-none"
                    >
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name ?? ""} className="w-8 h-8 rounded-full border border-[#1E1E2E]" />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm"
                          style={{ background: colors.border, color: colors.primary }}
                        >
                          {(user.name ?? user.email ?? "U")[0].toUpperCase()}
                        </div>
                      )}
                    </button>
                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-11 w-52 rounded-xl shadow-2xl z-50 overflow-hidden"
                          style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
                        >
                          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <p className="text-xs font-mono text-[#9CA3AF] truncate">{user.name ?? user.email}</p>
                            <p className="text-xs font-mono capitalize mt-0.5" style={{ color: colors.secondary }}>{user.plan} plan</p>
                          </div>
                          <Link href="/settings" onClick={() => setProfileOpen(false)}>
                            <div
                              className="flex items-center gap-2 px-4 py-2.5 text-sm font-mono text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = colors.border)}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
                            >
                              <Settings className="w-3.5 h-3.5" />
                              Settings
                            </div>
                          </Link>
                          <button
                            onClick={() => { logout(); setProfileOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm font-mono text-[#9CA3AF] hover:text-[#F87171] transition-colors rounded-b-xl"
                            onMouseEnter={(e) => (e.currentTarget.style.background = colors.border)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                          >
                            Sign out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <motion.a
                    href={loginUrl("/app")}
                    whileHover={{ color: "#F8FAFC" }}
                    className="text-sm font-mono text-[#9CA3AF] transition-colors"
                  >
                    Sign in
                  </motion.a>
                  <motion.a
                    href={loginUrl("/app")}
                    whileHover={{ scale: 1.05, boxShadow: `0 0 20px rgba(${colors.primaryRgb},0.35)` }}
                    whileTap={{ scale: 0.97 }}
                    className="text-sm font-mono px-4 py-1.5 rounded-lg font-semibold"
                    style={{ background: colors.primary, color: colors.bg }}
                  >
                    Get started free
                  </motion.a>
                </div>
              )
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <motion.button
              className="text-[#9CA3AF]"
              onClick={() => setMenuOpen(!menuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {menuOpen ? (
                  <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
            style={{ borderTop: `1px solid ${colors.border}`, background: colors.bg }}
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              <Link href="/pricing" onClick={() => setMenuOpen(false)} className="text-sm font-mono text-[#9CA3AF] transition-colors" style={{}}>Pricing</Link>
              <Link href="/about" onClick={() => setMenuOpen(false)} className="text-sm font-mono text-[#9CA3AF] transition-colors">About</Link>
              {user ? (
                <>
                  <Link href="/app" onClick={() => setMenuOpen(false)} className="text-sm font-mono" style={{ color: colors.primary }}>Dashboard</Link>
                  <Link href="/settings" onClick={() => setMenuOpen(false)} className="text-sm font-mono text-[#9CA3AF] flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" />Settings</Link>
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="text-left text-sm font-mono text-[#F87171]">Sign out</button>
                </>
              ) : (
                <a
                  href={loginUrl("/app")}
                  className="text-sm font-mono px-4 py-2.5 rounded-lg font-bold text-center"
                  style={{ background: colors.primary, color: colors.bg, boxShadow: `0 0 20px rgba(${colors.primaryRgb},0.3)` }}
                >
                  Get started free
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Link href={href}>
      <motion.span
        className="text-sm font-mono text-[#9CA3AF] cursor-pointer relative"
        whileHover={{ color: colors.primary }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.span>
    </Link>
  );
}
