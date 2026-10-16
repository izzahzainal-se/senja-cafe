"use client";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { Branch } from "@/lib/types";

type Status = "received" | "preparing" | "ready" | "completed" | "cancelled";

interface Order {
  id: string;
  branch_id: string;
  order_type: "dine_in" | "takeaway";
  customer_name: string;
  phone: string | null;
  table_number: string | null;
  pickup_time: string | null;
  total: number;
  status: Status;
  created_at: string;
  branches: { name: string } | null;
  order_items: { quantity: number; menu_items: { name: string } | null }[];
}

const NEXT: Partial<Record<Status, Status>> = {
  received: "preparing",
  preparing: "ready",
  ready: "completed",
};

const STATUS_STYLE: Record<Status, string> = {
  received: "bg-ember text-cream",
  preparing: "bg-glow text-rust",
  ready: "bg-dusk text-cream",
  completed: "bg-mist/40 text-midnight",
  cancelled: "bg-red-100 text-red-700",
};

const FILTERS = ["active", "completed", "cancelled", "all"] as const;
type Filter = (typeof FILTERS)[number];

const fmt = (n: number) => `RM ${Number(n).toFixed(2)}`;
const time = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" }) : "";

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("all");
  const [filter, setFilter] = useState<Filter>("active");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, branch_id, order_type, customer_name, phone, table_number, pickup_time, total, status, created_at, branches(name), order_items(quantity, menu_items(name))"
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) console.error(error);
    if (data) setOrders(data as unknown as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    supabase.from("branches").select("*").order("name").then(({ data }) => data && setBranches(data));

    // Live: order baru / status berubah → reload
    const channel = supabase
      .channel("orders-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  async function setStatus(id: string, status: Status) {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      alert(error.message);
      load();
    }
  }

  const today = new Date().toDateString();
  const inBranch = orders.filter((o) => branchId === "all" || o.branch_id === branchId);
  const active = inBranch.filter((o) => ["received", "preparing", "ready"].includes(o.status));
  const todaySales = inBranch
    .filter((o) => o.status !== "cancelled" && new Date(o.created_at).toDateString() === today)
    .reduce((s, o) => s + Number(o.total), 0);

  const visible = inBranch.filter((o) =>
    filter === "all" ? true : filter === "active" ? active.includes(o) : o.status === filter
  );

  return (
    <div>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-rust p-6 text-cream">
          <p className="text-xs uppercase tracking-[0.3em] text-cream/70">Active orders</p>
          <p className="mt-2 font-serif text-5xl">{active.length}</p>
        </div>
        <div className="rounded-3xl bg-midnight p-6 text-cream">
          <p className="text-xs uppercase tracking-[0.3em] text-cream/70">Today&apos;s sales</p>
          <p className="mt-2 font-serif text-5xl">{fmt(todaySales)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="rounded-full border border-rust/20 bg-transparent px-4 py-2 text-sm outline-none"
        >
          <option value="all">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm capitalize transition-colors ${
              filter === f ? "bg-rust text-cream" : "border border-rust/20 hover:border-ember"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-2 text-xs text-rust/60">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" /> Live
        </span>
      </div>

      {/* Orders */}
      {loading ? (
        <p className="mt-10 text-sm text-rust/60">Loading orders…</p>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-sm text-rust/60">No orders here.</p>
      ) : (
        <motion.div layout className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((o) => (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col rounded-2xl bg-white/70 p-5 ring-1 ring-rust/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-rust/50">
                      #{o.id.slice(0, 6).toUpperCase()} · {time(o.created_at)}
                    </p>
                    <p className="font-serif text-xl">{o.customer_name}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${STATUS_STYLE[o.status]}`}>
                    {o.status}
                  </span>
                </div>

                <p className="mt-1 text-xs text-rust/60">
                  {o.branches?.name} ·{" "}
                  {o.order_type === "dine_in"
                    ? `Dine in · Table ${o.table_number}`
                    : `Takeaway · ${time(o.pickup_time)} · ${o.phone}`}
                </p>

                <ul className="mt-4 flex-1 space-y-1 text-sm">
                  {o.order_items.map((it, i) => (
                    <li key={i}>
                      <span className="text-rust/50">{it.quantity} ×</span> {it.menu_items?.name}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t border-rust/10 pt-4">
                  <span className="font-serif text-lg">{fmt(o.total)}</span>
                  <div className="flex gap-2">
                    {o.status !== "completed" && o.status !== "cancelled" && (
                      <button
                        onClick={() => setStatus(o.id, "cancelled")}
                        className="rounded-full px-3 py-1.5 text-xs text-rust/60 hover:text-red-700"
                      >
                        Cancel
                      </button>
                    )}
                    {NEXT[o.status] && (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setStatus(o.id, NEXT[o.status]!)}
                        className="rounded-full bg-rust px-4 py-1.5 text-xs capitalize text-cream hover:bg-ember"
                      >
                        Mark {NEXT[o.status]}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}