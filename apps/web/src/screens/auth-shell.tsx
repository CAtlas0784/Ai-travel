import { motion } from "framer-motion";
import { MapPinned } from "lucide-react";

export function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <motion.div
        className="absolute left-10 top-10 h-56 w-56 rounded-full bg-green-300/30 blur-3xl"
        animate={{ scale: [1, 1.08, 1], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-8 right-8 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl"
        animate={{ scale: [1, 1.12, 1], y: [0, -18, 0] }}
        transition={{ duration: 9, repeat: Infinity }}
      />
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative w-full max-w-md rounded-2xl p-8 shadow-soft"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white">
            <MapPinned size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-primary">Uthai Thani</p>
            <h1 className="text-2xl font-extrabold text-ink dark:text-white">{title}</h1>
          </div>
        </div>
        <p className="mb-6 text-sm leading-6 text-slate-600 dark:text-slate-300">{subtitle}</p>
        {children}
      </motion.section>
    </main>
  );
}
