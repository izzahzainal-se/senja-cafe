"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import SenjaSun from "./SenjaSun";

const LINKS = [
  { href: "#menu", label: "Menu" },
  { href: "#reserve", label: "Reserve" },
];

type Mode = "day" | "night" | "solid";

export default function Navbar() {
  const { scrollY } = useScroll();
  const [mode, setMode] = useState<Mode>("day");
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    if (open) return;
    const vh = window.innerHeight;
    const prev = scrollY.getPrevious() ?? 0;
    // Scroll bawah → sorok, scroll atas → muncul
    setHidden(y > prev && y > vh * 0.3);
    // Warna ikut langit hero
    const menuTop = document.getElementById("menu")?.offsetTop ?? vh * 2.5;
    setMode(y < vh * 0.6 ? "day" : y < menuTop + 120 ? "night" : "solid");
  });

  // Kunci scroll masa menu terbuka + tutup guna Esc / skrin besar
  useEffect(() => {
    const root = document.documentElement;
    root.style.overflow = open ? "hidden" : "";

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth >= 768 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      root.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const tone = open
    ? "text-cream"
    : mode === "solid"
    ? "bg-cream/80 text-rust shadow-sm backdrop-blur-md"
    : mode === "night"
    ? "text-cream"
    : "text-rust";

  const cta =
    mode === "night" ? "bg-cream text-midnight hover:bg-glow" : "bg-rust text-cream hover:bg-ember";

  return (
    <>
      <motion.header
        animate={{ y: hidden && !open ? "-100%" : "0%" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`fixed inset-x-0 top-0 z-[70] transition-colors duration-500 ${tone}`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <a href="#top" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <SenjaSun className="w-9" />
            <span className="font-serif text-2xl">Senja.</span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="group relative text-sm">
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-current transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <a href="#menu" className={`rounded-full px-5 py-2 text-sm transition-colors ${cta}`}>
              Order now
            </a>
          </div>

          {/* Hamburger: kawasan sentuh 48px */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="relative -mr-2 h-12 w-12 touch-manipulation md:hidden"
          >
            <motion.span
              animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
              className="pointer-events-none absolute left-3 right-3 top-1/2 h-0.5 bg-current"
            />
            <motion.span
              animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
              className="pointer-events-none absolute left-3 right-3 top-1/2 h-0.5 bg-current"
            />
          </button>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            data-lenis-prevent
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-midnight text-cream md:hidden"
          >
            {[...LINKS, { href: "#menu", label: "Order now" }].map((l, i) => (
              <motion.a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="font-serif text-5xl"
              >
                {l.label}
              </motion.a>
            ))}
            <p className="absolute bottom-10 font-serif italic text-cream/50">Senja pergi, kopi menanti.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}