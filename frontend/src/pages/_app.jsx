import "../styles/globals.css";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const pageTransition = {
  duration: 0.25,
  ease: "easeOut",
};

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <AnimatePresence mode="wait">
        <motion.main
          key={router.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10"
        >
          <Component {...pageProps} />
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

export default MyApp;
