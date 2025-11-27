import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { logout } from "../lib/api";

const navVariants = {
  initial: { y: -16, opacity: 0 },
  animate: { y: 0, opacity: 1 },
};

export default function Navbar({ user }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navLinks = [
    { href: "/requests", label: "Requests" },
  ];

  const isActive = (href) => router.pathname === href;

  return (
    <motion.nav
      variants={navVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="sticky top-0 z-40 mb-6 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 md:px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-500 to-sky-400 shadow-lg shadow-primary-500/40">
            <span className="text-lg font-bold text-slate-950">SB</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-50">
              Study Buddy
            </span>
            <span className="text-[11px] text-slate-400">
              Peer-to-peer tutoring
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                  isActive(link.href)
                    ? "bg-slate-800 text-slate-50"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-medium text-slate-100">
                  {user.name}
                </span>
                {user.roles && (
                  <span className="text-[11px] uppercase tracking-wide text-slate-400">
                    {user.roles.join(" • ")}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary text-xs sm:text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-slate-300 hover:text-white">
                Login
              </Link>
              <Link href="/register" className="btn-primary text-xs sm:text-sm">
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
