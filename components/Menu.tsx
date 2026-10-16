"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { Branch, Category, CartLine, MenuItem, OrderType } from "@/lib/types";
import CartDrawer from "./CartDrawer";

const CATEGORIES: { id: "all" | Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "coffee", label: "Coffee" },
  { id: "non-coffee", label: "Non-Coffee" },
  { id: "brunch", label: "Brunch" },
  { id: "pastry", label: "Pastry" },
];

const GRADIENT: Record<Category, string> = {
  coffee: "from-rust to-ember",
  "non-coffee": "from-slate to-dusk",
  brunch: "from-glow to-ember",
  pastry: "from-sand to-glow",
};

export const fmt = (n: number) => `RM ${Number(n).toFixed(2)}`;

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [m, b] = await Promise.all([
        supabase.from("menu_items").select("*").order("is_signature", { ascending: false }).order("name"),
        supabase.from("branches").select("*").order("name"),
      ]);
      if (m.data) setItems(m.data);
      if (b.data) {
        setBranches(b.data);
        setBranchId(b.data[0]?.id ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(
    () => (category === "all" ? items : items.filter((i) => i.category === category)),
    [items, category]
  );
  const branch = branches.find((b) => b.id === branchId);
  const count = cart.reduce((s, l) => s + l.quantity, 0);

  const add = (item: MenuItem) =>
    setCart((c) =>
      c.some((l) => l.item.id === item.id)
        ? c.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l))
        : [...c, { item, quantity: 1 }]
    );

  const setQty = (id: string, q: number) =>
    setCart((c) =>
      q <= 0 ? c.filter((l) => l.item.id !== id) : c.map((l) => (l.item.id === id ? { ...l, quantity: q } : l))
    );

  return (
    <section id="menu" className="bg-cream text-rust">
      {/* Sunrise band */}
      <div className="h-48 bg-linear-to-b from-midnight to-cream" />

      <div className="mx-auto max-w-6xl px-4 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-ember">The Menu</p>
          <h2 className="mt-4 font-serif text-5xl md:text-7xl">Something for every hour.</h2>
        </motion.div>

        {/* Branch + mode */}
        <div className="mt-12 flex flex-col items-center gap-4 md:flex-row md:justify-center">
          <label className="flex items-center gap-3 rounded-full border border-rust/20 px-5 py-2.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-rust/60">Branch</span>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="cursor-pointer bg-transparent text-sm outline-none"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>

          <div className="flex rounded-full border border-rust/20 p-1">
            {(["dine_in", "takeaway"] as OrderType[]).map((t) => (
              <button key={t} onClick={() => setOrderType(t)} className="relative px-6 py-2 text-sm">
                {orderType === t && (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-full bg-rust"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 transition-colors ${orderType === t ? "text-cream" : "text-rust"}`}>
                  {t === "dine_in" ? "Dine in" : "Takeaway"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Branch info */}
        <AnimatePresence mode="wait">
          {branch && (
            <motion.p
              key={branch.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 text-center text-sm text-rust/70"
            >
              {branch.address} · {branch.opening_hours}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Category tabs */}
        <div className="mt-12 flex justify-center gap-6 overflow-x-auto md:gap-10">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)} className="relative shrink-0 pb-2 text-sm">
              <span className={category === c.id ? "text-rust" : "text-rust/50 hover:text-rust"}>{c.label}</span>
              {category === c.id && (
                <motion.span layoutId="cat-underline" className="absolute inset-x-0 -bottom-px h-0.5 bg-ember" />
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        <motion.div layout className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl bg-sand/50" />
            ))}

          <AnimatePresence mode="popLayout">
            {visible.map((item) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -6 }}
                className="group overflow-hidden rounded-3xl bg-white/60 shadow-sm ring-1 ring-rust/10"
              >
                <div className={`relative aspect-[4/3] overflow-hidden bg-linear-to-br ${GRADIENT[item.category]}`}>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center font-serif text-8xl text-cream/30 transition-transform duration-700 group-hover:scale-110">
                      {item.name[0]}
                    </span>
                  )}
                  {item.is_signature && (
                    <span className="absolute left-4 top-4 rounded-full bg-cream/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-rust">
                      Signature
                    </span>
                  )}
                  {!item.is_available && (
                    <div className="absolute inset-0 grid place-items-center bg-midnight/60 text-xs uppercase tracking-[0.3em] text-cream">
                      Sold out
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between gap-4 p-5">
                  <div>
                    <h3 className="font-serif text-xl">{item.name}</h3>
                    <p className="mt-1 text-sm text-rust/70">{item.description}</p>
                    <p className="mt-3 text-sm font-semibold">{fmt(item.price)}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    disabled={!item.is_available}
                    onClick={() => add(item)}
                    aria-label={`Add ${item.name}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rust text-xl text-cream transition-colors hover:bg-ember disabled:opacity-30"
                  >
                    +
                  </motion.button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Floating cart */}
      <AnimatePresence>
        {count > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-midnight px-6 py-4 text-cream shadow-2xl"
          >
            <span className="text-sm">View order</span>
            <motion.span
              key={count}
              initial={{ scale: 1.6 }}
              animate={{ scale: 1 }}
              className="grid h-7 w-7 place-items-center rounded-full bg-ember text-xs font-semibold"
            >
              {count}
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        setQty={setQty}
        clearCart={() => setCart([])}
        branch={branch}
        orderType={orderType}
      />
    </section>
  );
}