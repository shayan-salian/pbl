import Link from "next/link";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";

const heroParent = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const featureList = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const featureItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

const features = [
  {
    icon: "📚",
    title: "Post smart requests",
    desc: "Describe your doubts with subject, topic, time and budget. Let the right peer tutor find you.",
  },
  {
    icon: "🤝",
    title: "Match with real peers",
    desc: "Seniors and high-performers from your own ecosystem, not random strangers.",
  },
  {
    icon: "💬",
    title: "Learn in real-time",
    desc: "Chat, clarify, and iterate quickly with focused, one-to-one sessions.",
  },
];

export default function Home() {
  // Navbar user is loaded from pages that need it; on home it's fine to leave empty
  return (
    <>
      <Navbar />

      <motion.section
        variants={heroParent}
        initial="hidden"
        animate="visible"
        className="mt-4 md:mt-8 grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-center"
      >
        {/* Left: Hero text */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-300 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live prototype • Built with Next.js & Socket.io
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-50 mb-4">
            Turn <span className="text-primary-400">peer help</span> into
            structured{" "}
            <span className="underline decoration-primary-500/70 decoration-2 underline-offset-4">
              tutoring
            </span>
            .
          </h1>

          <p className="text-sm md:text-base text-slate-300 max-w-xl mb-6">
            Study Buddy is a peer-to-peer tutoring marketplace where students
            post requests, tutors accept them, and both connect in real-time
            chat. Designed for Indian campuses, inspired by global platforms.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link href="/requests" className="btn-primary text-sm">
              Browse live requests
            </Link>
            <Link href="/register" className="btn-secondary text-sm">
              Become a peer tutor
            </Link>
          </div>

          <motion.div
            variants={featureList}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-3"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={featureItem}
                className="card flex flex-col gap-2"
              >
                <div className="text-2xl">{feature.icon}</div>
                <h3 className="text-sm font-semibold text-slate-100">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right: Simple “live” preview card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="card relative overflow-hidden"
        >
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-200">
              Live request snapshot
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
              Demo data
            </span>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-100">
                  Mathematics • Calculus
                </span>
                <span className="status-pill-open text-[10px]">Open</span>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                “Need help with derivatives and chain rule before tomorrow's
                quiz.”
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Budget: ₹500</span>
                <span>Evening • Online</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-100">
                  Physics • Kinematics
                </span>
                <span className="status-pill-accepted text-[10px]">
                  Accepted
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                Matched with <span className="font-semibold">Bob</span>, 3rd
                year tutor • Rated 4.8/5.
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Starts in 15 min</span>
                <span>Chat + diagrams</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>Built as a working MVP for peer tutoring.</span>
            <span className="hidden sm:inline text-primary-300">
              Real-time chat • Reviews • Role-based auth
            </span>
          </div>
        </motion.div>
      </motion.section>
    </>
  );
}
